"""
Department and Office models for organizational structure.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

User = get_user_model()


class Department(models.Model):
    """
    Model for organizational departments.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    manager = models.CharField(max_length=200, blank=True)
    code = models.TextField(blank=True)
    head = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='headed_departments'
    )
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'departments'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['head']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def office_count(self):
        return self.offices.count()
    
    @property
    def member_count(self):
        return self.members.values('user').distinct().count()


class Office(models.Model):
    """
    Model for office locations within departments.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='offices'
    )
    name = models.CharField(max_length=100)
    manager = models.CharField(max_length=200, blank=True)
    code = models.TextField(blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'offices'
        verbose_name = 'Office'
        verbose_name_plural = 'Offices'
        ordering = ['department', 'name']
        unique_together = ['department', 'name']
        indexes = [
            models.Index(fields=['department']),
            models.Index(fields=['manager']),
        ]
    
    def __str__(self):
        try:
            return f"{self.name} - {self.department.name}"
        except:
            return f"{self.name}"
    
    @property
    def member_count(self):
        return self.members.filter(status='active').count()


class DepartmentOfficeUser(models.Model):
    """
    Junction model linking users to departments and offices.
    Allows flexible user assignment to multiple departments/offices.
    """
    
    class MemberStatus(models.TextChoices):
        ACTIVE = 'active', 'Active'
        INACTIVE = 'inactive', 'Inactive'
        LEFT = 'left', 'Left'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='department_assignments'
    )
    department = models.ForeignKey(
        Department,
        on_delete=models.CASCADE,
        related_name='members'
    )
    office = models.ForeignKey(
        Office,
        on_delete=models.CASCADE,
        related_name='members'
    )
    status = models.CharField(
        max_length=20,
        choices=MemberStatus.choices,
        default=MemberStatus.ACTIVE
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    left_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'department_office_users'
        verbose_name = 'Department Office User'
        verbose_name_plural = 'Department Office Users'
        unique_together = ['user', 'department', 'office']
        ordering = ['-joined_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['department']),
            models.Index(fields=['office']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.office.name}"
    
    def mark_as_left(self):
        """Mark user as left from department/office."""
        self.status = self.MemberStatus.LEFT
        self.left_at = timezone.now()
        self.save(update_fields=['status', 'left_at'])
