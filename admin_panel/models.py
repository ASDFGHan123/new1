"""
Admin panel models for OffChat application.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.files.base import ContentFile
import uuid
import json

User = get_user_model()


class AuditLog(models.Model):
    """
    Comprehensive audit logging model for tracking all system actions.
    """
    
    class ActionType(models.TextChoices):
        # Authentication actions
        USER_LOGIN = 'USER_LOGIN', 'User Login'
        USER_LOGOUT = 'USER_LOGOUT', 'User Logout'
        USER_FAILED_LOGIN = 'USER_FAILED_LOGIN', 'Failed User Login'
        PASSWORD_CHANGED = 'PASSWORD_CHANGED', 'Password Changed'
        EMAIL_VERIFIED = 'EMAIL_VERIFIED', 'Email Verified'
        
        # User management actions
        USER_CREATED = 'USER_CREATED', 'User Created'
        USER_UPDATED = 'USER_UPDATED', 'User Updated'
        USER_DELETED = 'USER_DELETED', 'User Deleted'
        USER_APPROVED = 'USER_APPROVED', 'User Approved'
        USER_SUSPENDED = 'USER_SUSPENDED', 'User Suspended'
        USER_BANNED = 'USER_BANNED', 'User Banned'
        USER_ACTIVATED = 'USER_ACTIVATED', 'User Activated'
        USER_DEACTIVATED = 'USER_DEACTIVATED', 'User Deactivated'
        FORCE_LOGOUT = 'FORCE_LOGOUT', 'Force Logout'
        
        # Role and permission actions
        ROLE_CHANGED = 'ROLE_CHANGED', 'Role Changed'
        PERMISSION_GRANTED = 'PERMISSION_GRANTED', 'Permission Granted'
        PERMISSION_REVOKED = 'PERMISSION_REVOKED', 'Permission Revoked'
        
        # Chat actions
        CONVERSATION_CREATED = 'CONVERSATION_CREATED', 'Conversation Created'
        CONVERSATION_UPDATED = 'CONVERSATION_UPDATED', 'Conversation Updated'
        CONVERSATION_DELETED = 'CONVERSATION_DELETED', 'Conversation Deleted'
        
        MESSAGE_SENT = 'MESSAGE_SENT', 'Message Sent'
        MESSAGE_EDITED = 'MESSAGE_EDITED', 'Message Edited'
        MESSAGE_DELETED = 'MESSAGE_DELETED', 'Message Deleted'
        MESSAGE_FORWARDED = 'MESSAGE_FORWARDED', 'Message Forwarded'
        
        GROUP_CREATED = 'GROUP_CREATED', 'Group Created'
        GROUP_UPDATED = 'GROUP_UPDATED', 'Group Updated'
        GROUP_DELETED = 'GROUP_DELETED', 'Group Deleted'
        GROUP_JOINED = 'GROUP_JOINED', 'Group Joined'
        GROUP_LEFT = 'GROUP_LEFT', 'Group Left'
        MEMBER_ADDED = 'MEMBER_ADDED', 'Member Added'
        MEMBER_REMOVED = 'MEMBER_REMOVED', 'Member Removed'
        MEMBER_ROLE_CHANGED = 'MEMBER_ROLE_CHANGED', 'Member Role Changed'
        
        # File actions
        FILE_UPLOADED = 'FILE_UPLOADED', 'File Uploaded'
        FILE_DELETED = 'FILE_DELETED', 'File Deleted'
        FILE_DOWNLOADED = 'FILE_DOWNLOADED', 'File Downloaded'
        
        # Admin panel actions
        SYSTEM_SETTINGS_CHANGED = 'SYSTEM_SETTINGS_CHANGED', 'System Settings Changed'
        BACKUP_CREATED = 'BACKUP_CREATED', 'Backup Created'
        BACKUP_RESTORED = 'BACKUP_RESTORED', 'Backup Restored'
        
        # Security actions
        SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY', 'Suspicious Activity'
        SECURITY_BREACH = 'SECURITY_BREACH', 'Security Breach'
        RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED', 'Rate Limit Exceeded'
        
        # Analytics actions
        DATA_EXPORTED = 'DATA_EXPORTED', 'Data Exported'
        REPORT_GENERATED = 'REPORT_GENERATED', 'Report Generated'
        
        # Trash actions
        ITEM_MOVED_TO_TRASH = 'ITEM_MOVED_TO_TRASH', 'Item Moved to Trash'
        ITEM_RESTORED = 'ITEM_RESTORED', 'Item Restored'
        PERMANENT_DELETE = 'PERMANENT_DELETE', 'Permanent Delete'
    
    class SeverityLevel(models.TextChoices):
        LOW = 'low', 'Low'
        INFO = 'info', 'Info'
        WARNING = 'warning', 'Warning'
        ERROR = 'error', 'Error'
        CRITICAL = 'critical', 'Critical'
    
    class TargetType(models.TextChoices):
        USER = 'USER', 'User'
        CONVERSATION = 'CONVERSATION', 'Conversation'
        MESSAGE = 'MESSAGE', 'Message'
        GROUP = 'GROUP', 'Group'
        FILE = 'FILE', 'File'
        SYSTEM = 'SYSTEM', 'System'
        AUTH = 'AUTH', 'Authentication'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Action details
    action_type = models.CharField(max_length=50, choices=ActionType.choices)
    description = models.TextField()
    
    # Actor and target
    actor = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_logs'
    )
    target_type = models.CharField(max_length=20, choices=TargetType.choices)
    target_id = models.CharField(max_length=255, null=True, blank=True)
    
    # Severity and categorization
    severity = models.CharField(
        max_length=20, 
        choices=SeverityLevel.choices, 
        default=SeverityLevel.INFO
    )
    category = models.CharField(max_length=50, blank=True)
    
    # Network information
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    session_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Additional data
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['action_type']),
            models.Index(fields=['actor']),
            models.Index(fields=['target_type']),
            models.Index(fields=['target_id']),
            models.Index(fields=['severity']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['ip_address']),
            models.Index(fields=['category']),
        ]
    
    def __str__(self):
        return f"{self.action_type} by {self.actor} at {self.timestamp}"
    
    @classmethod
    def log_action(
        cls,
        action_type,
        description,
        actor=None,
        target_type=None,
        target_id=None,
        severity=SeverityLevel.INFO,
        category=None,
        ip_address=None,
        user_agent=None,
        session_id=None,
        metadata=None
    ):
        """Create a new audit log entry."""
        from utils.json_utils import prepare_metadata
        return cls.objects.create(
            action_type=action_type,
            description=description,
            actor=actor,
            target_type=target_type,
            target_id=str(target_id) if target_id else None,
            severity=severity,
            category=category,
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id,
            metadata=prepare_metadata(metadata or {})
        )


class Trash(models.Model):
    """
    Model for soft deletion (trash system).
    """
    
    class ItemType(models.TextChoices):
        USER = 'USER', 'User'
        CONVERSATION = 'CONVERSATION', 'Conversation'
        MESSAGE = 'MESSAGE', 'Message'
        GROUP = 'GROUP', 'Group'
        FILE = 'FILE', 'File'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Item information
    item_type = models.CharField(max_length=20, choices=ItemType.choices)
    item_id = models.CharField(max_length=255)
    item_data = models.JSONField(default=dict, blank=True)
    
    # Deletion details
    deleted_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='trashed_items'
    )
    delete_reason = models.TextField(blank=True)
    
    # Timestamps
    deleted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'trash'
        verbose_name = 'Trash Item'
        verbose_name_plural = 'Trash Items'
        ordering = ['-deleted_at']
        indexes = [
            models.Index(fields=['item_type']),
            models.Index(fields=['deleted_by']),
            models.Index(fields=['deleted_at']),
        ]
    
    def __str__(self):
        return f"{self.item_type} {self.item_id} in trash"
    
    @classmethod
    def move_to_trash(cls, item_type, item_id, deleted_by, delete_reason='', item_data=None):
        """Move an item to trash."""
        from utils.json_utils import prepare_metadata
        return cls.objects.create(
            item_type=item_type,
            item_id=str(item_id),
            deleted_by=deleted_by,
            delete_reason=delete_reason,
            item_data=prepare_metadata(item_data or {})
        )


class Backup(models.Model):
    """
    Model for backup and restore functionality.
    """
    
    class BackupType(models.TextChoices):
        FULL = 'full', 'Full Backup'
        USERS = 'users', 'Users Only'
        CHATS = 'chats', 'Chats Only'
        MESSAGES = 'messages', 'Messages Only'
    
    class BackupStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        IN_PROGRESS = 'in_progress', 'In Progress'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Backup information
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    backup_type = models.CharField(max_length=20, choices=BackupType.choices)
    
    # File information
    file = models.FileField(upload_to='backups/', null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    
    # Status and progress
    status = models.CharField(
        max_length=20,
        choices=BackupStatus.choices,
        default=BackupStatus.PENDING
    )
    progress = models.PositiveIntegerField(default=0)  # Percentage
    
    # Metadata
    record_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='backups'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'backups'
        verbose_name = 'Backup'
        verbose_name_plural = 'Backups'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['backup_type']),
            models.Index(fields=['status']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.backup_type})"
    
    def start_backup(self):
        """Start the backup process."""
        self.status = self.BackupStatus.IN_PROGRESS
        self.save(update_fields=['status'])
    
    def complete_backup(self, file_size=None, record_count=None):
        """Complete the backup process."""
        self.status = self.BackupStatus.COMPLETED
        self.progress = 100
        self.completed_at = timezone.now()
        
        if file_size:
            self.file_size = file_size
        if record_count:
            self.record_count = record_count
            
        self.save(update_fields=[
            'status', 'progress', 'completed_at', 'file_size', 'record_count'
        ])
    
    def fail_backup(self):
        """Mark backup as failed."""
        self.status = self.BackupStatus.FAILED
        self.completed_at = timezone.now()
        self.save(update_fields=['status', 'completed_at'])


class SystemSettings(models.Model):
    """
    Model for system-wide settings and configuration.
    """
    
    class SettingCategory(models.TextChoices):
        GENERAL = 'general', 'General'
        SECURITY = 'security', 'Security'
        CHAT = 'chat', 'Chat'
        EMAIL = 'email', 'Email'
        BACKUP = 'backup', 'Backup'
    
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=SettingCategory.choices)
    description = models.TextField(blank=True)
    
    # Metadata
    is_public = models.BooleanField(default=False)  # Can be accessed by regular users
    updated_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_settings'
        verbose_name = 'System Setting'
        verbose_name_plural = 'System Settings'
        ordering = ['category', 'key']
        indexes = [
            models.Index(fields=['key']),
            models.Index(fields=['category']),
            models.Index(fields=['is_public']),
        ]
    
    def __str__(self):
        return f"{self.key} = {self.value[:50]}"


class MessageTemplate(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='message_templates'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'message_templates'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return self.name


class AdminOutgoingMessage(models.Model):
    class MessageType(models.TextChoices):
        SYSTEM = 'system', 'System'
        BROADCAST = 'broadcast', 'Broadcast'
        TARGETED = 'targeted', 'Targeted'

    class MessageStatus(models.TextChoices):
        SENT = 'sent', 'Sent'
        DELIVERED = 'delivered', 'Delivered'
        FAILED = 'failed', 'Failed'

    class MessagePriority(models.TextChoices):
        LOW = 'low', 'Low'
        NORMAL = 'normal', 'Normal'
        HIGH = 'high', 'High'
        URGENT = 'urgent', 'Urgent'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    type = models.CharField(max_length=20, choices=MessageType.choices)
    content = models.TextField()
    recipients = models.JSONField(default=list, blank=True)
    recipient_count = models.PositiveIntegerField(default=0)
    sent_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='admin_outgoing_messages'
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=MessageStatus.choices, default=MessageStatus.SENT)
    priority = models.CharField(max_length=20, choices=MessagePriority.choices, default=MessagePriority.NORMAL)

    class Meta:
        db_table = 'admin_outgoing_messages'
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['type']),
            models.Index(fields=['status']),
            models.Index(fields=['priority']),
            models.Index(fields=['sent_at']),
        ]

    def __str__(self):
        return f"{self.type}: {self.content[:50]}"



