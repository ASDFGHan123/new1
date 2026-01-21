"""
Moderator role and permissions management for OffChat.
Defines all moderator capabilities and permission checks.
"""
from django.contrib.auth import get_user_model
from django.db import models
from admin_panel.models import AuditLog

User = get_user_model()


class ModeratorPermission(models.Model):
    """
    Define moderator permissions and capabilities.
    """
    
    PERMISSION_CHOICES = [
        ('view_users', 'View Users'),
        ('view_conversations', 'View Conversations'),
        ('view_messages', 'View Messages'),
        ('delete_messages', 'Delete Messages'),
        ('warn_users', 'Warn Users'),
        ('suspend_users', 'Suspend Users'),
        ('ban_users', 'Ban Users'),
        ('view_audit_logs', 'View Audit Logs'),
        ('manage_groups', 'Manage Groups'),
        ('view_reports', 'View Reports'),
        ('moderate_content', 'Moderate Content'),
        ('manage_trash', 'Manage Trash'),
    ]
    
    permission = models.CharField(max_length=50, unique=True, choices=PERMISSION_CHOICES)
    description = models.TextField()
    
    class Meta:
        db_table = 'moderator_permissions'
        verbose_name = 'Moderator Permission'
        verbose_name_plural = 'Moderator Permissions'
    
    def __str__(self):
        return self.get_permission_display()


class ModeratorRole(models.Model):
    """
    Define moderator roles with specific permissions.
    """
    
    ROLE_TYPES = [
        ('junior', 'Junior Moderator'),
        ('senior', 'Senior Moderator'),
        ('lead', 'Lead Moderator'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    role_type = models.CharField(max_length=20, choices=ROLE_TYPES, default='junior')
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(ModeratorPermission, related_name='roles')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'moderator_roles'
        verbose_name = 'Moderator Role'
        verbose_name_plural = 'Moderator Roles'
    
    def __str__(self):
        return self.name


class ModeratorProfile(models.Model):
    """
    Extended profile for moderators with additional metadata.
    """
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='moderator_profile')
    role = models.ForeignKey(ModeratorRole, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Moderation stats
    warnings_issued = models.PositiveIntegerField(default=0)
    suspensions_issued = models.PositiveIntegerField(default=0)
    bans_issued = models.PositiveIntegerField(default=0)
    messages_deleted = models.PositiveIntegerField(default=0)
    
    # Activity tracking
    last_moderation_action = models.DateTimeField(null=True, blank=True)
    is_active_moderator = models.BooleanField(default=True)
    
    # Timestamps
    assigned_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'moderator_profiles'
        verbose_name = 'Moderator Profile'
        verbose_name_plural = 'Moderator Profiles'
    
    def __str__(self):
        return f"Moderator: {self.user.username}"
    
    def has_permission(self, permission_code):
        """Check if moderator has specific permission."""
        if not self.is_active_moderator or not self.role:
            return False
        return self.role.permissions.filter(permission=permission_code).exists()
    
    def get_permissions(self):
        """Get all permissions for this moderator."""
        if not self.role:
            return []
        return list(self.role.permissions.values_list('permission', flat=True))


class ModerationAction(models.Model):
    """
    Track all moderation actions taken by moderators.
    """
    
    ACTION_TYPES = [
        ('warning', 'Warning'),
        ('suspend', 'Suspend'),
        ('ban', 'Ban'),
        ('delete_message', 'Delete Message'),
        ('delete_conversation', 'Delete Conversation'),
        ('remove_group_member', 'Remove Group Member'),
        ('close_group', 'Close Group'),
    ]
    
    moderator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='moderation_actions')
    action_type = models.CharField(max_length=30, choices=ACTION_TYPES)
    target_user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='moderation_actions_against',
        null=True,
        blank=True
    )
    target_id = models.CharField(max_length=255, blank=True)  # For messages, conversations, etc.
    target_type = models.CharField(max_length=50, blank=True)  # message, conversation, group, etc.
    
    reason = models.TextField()
    duration = models.CharField(max_length=50, blank=True)  # For temporary actions
    
    # Status
    is_active = models.BooleanField(default=True)
    appeal_status = models.CharField(
        max_length=20,
        choices=[
            ('none', 'No Appeal'),
            ('pending', 'Appeal Pending'),
            ('approved', 'Appeal Approved'),
            ('rejected', 'Appeal Rejected'),
        ],
        default='none'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'moderation_actions'
        verbose_name = 'Moderation Action'
        verbose_name_plural = 'Moderation Actions'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['moderator']),
            models.Index(fields=['target_user']),
            models.Index(fields=['action_type']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_action_type_display()} by {self.moderator.username}"


class ModeratorPermissionHelper:
    """
    Helper class for moderator permission checks.
    """
    
    # Default permissions for each moderator role type
    DEFAULT_PERMISSIONS = {
        'junior': [
            'view_users',
            'view_conversations',
            'view_messages',
            'delete_messages',
            'warn_users',
            'view_reports',
            'moderate_content',
        ],
        'senior': [
            'view_users',
            'view_conversations',
            'view_messages',
            'delete_messages',
            'warn_users',
            'suspend_users',
            'view_audit_logs',
            'manage_groups',
            'view_reports',
            'moderate_content',
            'manage_trash',
        ],
        'lead': [
            'view_users',
            'view_conversations',
            'view_messages',
            'delete_messages',
            'warn_users',
            'suspend_users',
            'ban_users',
            'view_audit_logs',
            'manage_groups',
            'view_reports',
            'moderate_content',
            'manage_trash',
        ],
    }
    
    @staticmethod
    def is_moderator(user):
        """Check if user is a moderator."""
        return user.role == 'moderator' and hasattr(user, 'moderator_profile')
    
    @staticmethod
    def can_moderate_user(moderator, target_user):
        """Check if moderator can moderate a specific user."""
        if not ModeratorPermissionHelper.is_moderator(moderator):
            return False
        
        # Moderators cannot moderate admins
        if target_user.role == 'admin':
            return False
        
        # Moderators cannot moderate other moderators (unless lead)
        if target_user.role == 'moderator':
            mod_profile = moderator.moderator_profile
            return mod_profile.role and mod_profile.role.role_type == 'lead'
        
        return True
    
    @staticmethod
    def can_delete_message(moderator):
        """Check if moderator can delete messages."""
        if not ModeratorPermissionHelper.is_moderator(moderator):
            return False
        return moderator.moderator_profile.has_permission('delete_messages')
    
    @staticmethod
    def can_warn_user(moderator):
        """Check if moderator can warn users."""
        if not ModeratorPermissionHelper.is_moderator(moderator):
            return False
        return moderator.moderator_profile.has_permission('warn_users')
    
    @staticmethod
    def can_suspend_user(moderator):
        """Check if moderator can suspend users."""
        if not ModeratorPermissionHelper.is_moderator(moderator):
            return False
        return moderator.moderator_profile.has_permission('suspend_users')
    
    @staticmethod
    def can_ban_user(moderator):
        """Check if moderator can ban users."""
        if not ModeratorPermissionHelper.is_moderator(moderator):
            return False
        return moderator.moderator_profile.has_permission('ban_users')
    
    @staticmethod
    def can_view_audit_logs(moderator):
        """Check if moderator can view audit logs."""
        if not ModeratorPermissionHelper.is_moderator(moderator):
            return False
        return moderator.moderator_profile.has_permission('view_audit_logs')
    
    @staticmethod
    def create_moderator_role(role_type='junior'):
        """Create default moderator role with permissions."""
        role, created = ModeratorRole.objects.get_or_create(
            name=f'{role_type.capitalize()} Moderator',
            role_type=role_type
        )
        
        if created:
            permissions = ModeratorPermissionHelper.DEFAULT_PERMISSIONS.get(role_type, [])
            for perm_code in permissions:
                perm, _ = ModeratorPermission.objects.get_or_create(
                    permission=perm_code,
                    defaults={'description': perm_code.replace('_', ' ').title()}
                )
                role.permissions.add(perm)
        
        return role
    
    @staticmethod
    def assign_moderator_role(user, role_type='junior'):
        """Assign moderator role to a user."""
        if user.role != 'moderator':
            user.role = 'moderator'
            user.save(update_fields=['role'])
        
        role = ModeratorPermissionHelper.create_moderator_role(role_type)
        
        profile, created = ModeratorProfile.objects.get_or_create(user=user)
        profile.role = role
        profile.is_active_moderator = True
        profile.save()
        
        # Log the action
        AuditLog.log_action(
            action_type=AuditLog.ActionType.ROLE_CHANGED,
            description=f'User {user.username} assigned as {role_type} moderator',
            actor=None,
            target_type=AuditLog.TargetType.USER,
            target_id=str(user.id),
            severity=AuditLog.SeverityLevel.WARNING
        )
        
        return profile
    
    @staticmethod
    def remove_moderator_role(user):
        """Remove moderator role from a user."""
        if hasattr(user, 'moderator_profile'):
            user.moderator_profile.is_active_moderator = False
            user.moderator_profile.save()
        
        user.role = 'user'
        user.save(update_fields=['role'])
        
        # Log the action
        AuditLog.log_action(
            action_type=AuditLog.ActionType.ROLE_CHANGED,
            description=f'User {user.username} removed from moderator role',
            actor=None,
            target_type=AuditLog.TargetType.USER,
            target_id=str(user.id),
            severity=AuditLog.SeverityLevel.WARNING
        )
