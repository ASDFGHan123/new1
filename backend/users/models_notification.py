"""
Notification models for OffChat application.
"""
from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Notification(models.Model):
    """
    Model for user notifications.
    """
    
    class NotificationType(models.TextChoices):
        MESSAGE = 'message', 'New Message'
        USER_APPROVED = 'user_approved', 'User Approved'
        USER_REJECTED = 'user_rejected', 'User Rejected'
        GROUP_INVITE = 'group_invite', 'Group Invite'
        PROFILE_UPDATE = 'profile_update', 'Profile Updated'
        SYSTEM = 'system', 'System Alert'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['is_read']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
    
    def mark_as_read(self):
        self.is_read = True
        self.save(update_fields=['is_read'])
