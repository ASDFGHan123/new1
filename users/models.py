"""
User models for OffChat application.
"""
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from django.core.validators import RegexValidator

# Optional PIL import for image processing
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    Image = None


class UserManager(BaseUserManager):
    """Custom manager for User model."""
    
    def create_user(self, username, email, password=None, **extra_fields):
        """Create and return a regular user with an email and password."""
        if not username:
            raise ValueError('The Username must be set')
        if not email:
            raise ValueError('The Email must be set')
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        """Create and return a superuser with an email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('status', 'active')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(username, email, password, **extra_fields)
    
    def get_by_natural_key(self, username):
        """
        Retrieve a user by their natural key (username).
        This method is required for Django's authentication system.
        """
        return self.get(username=username)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model that extends AbstractBaseUser and PermissionsMixin.
    Supports user roles, statuses, and comprehensive profile management.
    """
    
    # Role choices
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('user', 'User'),
        ('moderator', 'Moderator'),
    ]
    
    # Status choices
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('pending', 'Pending'),
        ('suspended', 'Suspended'),
        ('banned', 'Banned'),
    ]
    
    # Online status choices
    ONLINE_STATUS_CHOICES = [
        ('online', 'Online'),
        ('away', 'Away'),
        ('offline', 'Offline'),
    ]
    
    # Core user fields
    username = models.CharField(
        max_length=150,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[\w.-]+$',
                message='Username can only contain letters, numbers, dots, underscores, and hyphens.'
            )
        ]
    )
    email = models.EmailField(unique=True)
    
    # User profile fields
    first_name = models.CharField(max_length=30, blank=True)
    last_name = models.CharField(max_length=30, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    
    # Role and status
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Activity tracking
    online_status = models.CharField(
        max_length=20, 
        choices=ONLINE_STATUS_CHOICES, 
        default='offline'
    )
    last_seen = models.DateTimeField(default=timezone.now)
    join_date = models.DateTimeField(default=timezone.now)
    
    # Statistics
    message_count = models.PositiveIntegerField(default=0)
    report_count = models.PositiveIntegerField(default=0)
    
    # Email verification
    email_verified = models.BooleanField(default=False)
    email_verification_token = models.CharField(max_length=255, blank=True)
    
    # Admin flags
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    EMAIL_FIELD = 'email'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['username']),
            models.Index(fields=['email']),
            models.Index(fields=['status']),
            models.Index(fields=['role']),
            models.Index(fields=['online_status']),
            models.Index(fields=['last_seen']),
        ]
    
    def __str__(self):
        return self.username
    
    @property
    def full_name(self):
        """Return the user's full name."""
        return f"{self.first_name} {self.last_name}".strip()
    
    @property
    def is_approved(self):
        """Check if user is approved (active status)."""
        return self.status == 'active'
    
    @property
    def is_online(self):
        """Check if user is currently online."""
        return self.online_status == 'online'
    
    def update_last_seen(self):
        """Update the last seen timestamp."""
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])
    
    def set_online(self):
        """Set user as online."""
        self.online_status = 'online'
        self.last_seen = timezone.now()
        self.save(update_fields=['online_status', 'last_seen'])
    
    def set_away(self):
        """Set user as away."""
        self.online_status = 'away'
        self.save(update_fields=['online_status'])
    
    def set_offline(self):
        """Set user as offline."""
        self.online_status = 'offline'
        self.last_seen = timezone.now()
        self.save(update_fields=['online_status', 'last_seen'])
    
    def increment_message_count(self):
        """Increment user's message count."""
        User.objects.filter(pk=self.pk).update(
            message_count=models.F('message_count') + 1
        )
        self.refresh_from_db()
    
    def increment_report_count(self):
        """Increment user's report count."""
        User.objects.filter(pk=self.pk).update(
            report_count=models.F('report_count') + 1
        )
        self.refresh_from_db()
    
    def approve_user(self):
        """Approve the user (set status to active)."""
        self.status = 'active'
        self.email_verified = True
        self.save(update_fields=['status', 'email_verified'])
    
    def suspend_user(self):
        """Suspend the user."""
        self.status = 'suspended'
        self.save(update_fields=['status'])
    
    def ban_user(self):
        """Ban the user."""
        self.status = 'banned'
        self.is_active = False
        self.save(update_fields=['status', 'is_active'])
    
    def activate_user(self):
        """Activate the user (set is_active to True)."""
        self.is_active = True
        if self.status in ['suspended', 'banned']:
            self.status = 'active'
        self.save(update_fields=['is_active', 'status'])
    
    def deactivate_user(self):
        """Deactivate the user (set is_active to False)."""
        self.is_active = False
        self.save(update_fields=['is_active'])
    
    def has_perm(self, perm, obj=None):
        """Check if user has a specific permission."""
        return super().has_perm(perm, obj)
    
    def has_module_perms(self, app_label):
        """Check if user has permissions for a specific app."""
        return super().has_module_perms(app_label)
    
    def save(self, *args, **kwargs):
        """Override save method."""
        if not self.join_date and self.created_at:
            self.join_date = self.created_at
        super().save(*args, **kwargs)


class UserSession(models.Model):
    """
    Model to track user sessions for security and monitoring.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    session_key = models.CharField(max_length=40, unique=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'user_sessions'
        verbose_name = 'User Session'
        verbose_name_plural = 'User Sessions'
        ordering = ['-last_activity']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['session_key']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.created_at}"
    
    def is_expired(self):
        """Check if session has expired."""
        return timezone.now() > self.expires_at
    
    def deactivate(self):
        """Deactivate the session."""
        self.is_active = False
        self.save(update_fields=['is_active'])


class UserActivity(models.Model):
    """
    Model to track user activities for analytics and monitoring.
    """
    
    ACTION_CHOICES = [
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('message_sent', 'Message Sent'),
        ('message_edited', 'Message Edited'),
        ('message_deleted', 'Message Deleted'),
        ('profile_updated', 'Profile Updated'),
        ('group_joined', 'Group Joined'),
        ('group_left', 'Group Left'),
        ('file_uploaded', 'File Uploaded'),
        ('status_changed', 'Status Changed'),
        ('password_changed', 'Password Changed'),
        ('email_verified', 'Email Verified'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activities')
    action = models.CharField(max_length=30, choices=ACTION_CHOICES)
    description = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'user_activities'
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['action']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.action} - {self.timestamp}"


class BlacklistedToken(models.Model):
    """
    Model to track blacklisted JWT tokens for secure logout.
    """
    
    token = models.TextField(unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blacklisted_tokens')
    token_type = models.CharField(
        max_length=20,
        choices=[
            ('access', 'Access Token'),
            ('refresh', 'Refresh Token'),
        ]
    )
    blacklisted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'blacklisted_tokens'
        verbose_name = 'Blacklisted Token'
        verbose_name_plural = 'Blacklisted Tokens'
        ordering = ['-blacklisted_at']
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user']),
            models.Index(fields=['token_type']),
            models.Index(fields=['blacklisted_at']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"{self.token_type} token for {self.user.username}"
    
    @classmethod
    def is_token_blacklisted(cls, token):
        """Check if a token is blacklisted."""
        return cls.objects.filter(token=token).exists()
    
    @classmethod
    def blacklist_token(cls, token, user, token_type, expires_at):
        """Add a token to the blacklist."""
        return cls.objects.create(
            token=token,
            user=user,
            token_type=token_type,
            expires_at=expires_at
        )


class IPAddress(models.Model):
    """
    Model to track IP addresses for security and analytics.
    """
    ip_address = models.GenericIPAddressField(unique=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    region = models.CharField(max_length=100, blank=True)
    isp = models.CharField(max_length=200, blank=True)
    is_threat = models.BooleanField(default=False)
    threat_type = models.CharField(max_length=50, blank=True)
    first_seen = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    request_count = models.PositiveIntegerField(default=0)
    blocked_until = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'ip_addresses'
        verbose_name = 'IP Address'
        verbose_name_plural = 'IP Addresses'
        ordering = ['-last_seen']
        indexes = [
            models.Index(fields=['ip_address']),
            models.Index(fields=['is_threat']),
            models.Index(fields=['blocked_until']),
            models.Index(fields=['last_seen']),
        ]
    
    def __str__(self):
        return self.ip_address
    
    def is_blocked(self):
        """Check if IP is currently blocked."""
        return self.blocked_until and timezone.now() < self.blocked_until
    
    def increment_request_count(self):
        """Increment request count."""
        self.request_count += 1
        self.last_seen = timezone.now()
        self.save(update_fields=['request_count', 'last_seen'])


class IPAccessLog(models.Model):
    """
    Model to log all IP access attempts for security monitoring.
    """
    ip_address = models.GenericIPAddressField()
    method = models.CharField(max_length=10)
    path = models.CharField(max_length=500)
    user_agent = models.TextField(blank=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    status_code = models.PositiveIntegerField()
    response_time = models.FloatField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_suspicious = models.BooleanField(default=False)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    class Meta:
        db_table = 'ip_access_logs'
        verbose_name = 'IP Access Log'
        verbose_name_plural = 'IP Access Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['ip_address']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['user']),
            models.Index(fields=['status_code']),
            models.Index(fields=['is_suspicious']),
        ]
    
    def __str__(self):
        return f"{self.ip_address} - {self.method} {self.path} - {self.timestamp}"


class SuspiciousActivity(models.Model):
    """
    Model to track suspicious activities and potential security threats.
    """
    ACTIVITY_TYPES = [
        ('rapid_requests', 'Rapid Requests'),
        ('failed_logins', 'Failed Login Attempts'),
        ('unusual_location', 'Unusual Location'),
        ('sql_injection', 'SQL Injection Attempt'),
        ('xss_attempt', 'XSS Attempt'),
        ('path_traversal', 'Path Traversal Attempt'),
        ('brute_force', 'Brute Force Attack'),
        ('bot_activity', 'Bot Activity'),
        ('malicious_file', 'Malicious File Upload'),
    ]
    
    ip_address = models.GenericIPAddressField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    description = models.TextField()
    severity = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical'),
        ],
        default='medium'
    )
    is_resolved = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict)
    
    class Meta:
        db_table = 'suspicious_activities'
        verbose_name = 'Suspicious Activity'
        verbose_name_plural = 'Suspicious Activities'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['ip_address']),
            models.Index(fields=['user']),
            models.Index(fields=['activity_type']),
            models.Index(fields=['severity']),
            models.Index(fields=['is_resolved']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.activity_type} from {self.ip_address} - {self.severity}"
