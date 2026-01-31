"""
Analytics models for OffChat application.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import uuid

User = get_user_model()


class UserAnalytics(models.Model):
    """
    Model to track user analytics and statistics.
    """
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='analytics'
    )
    
    # Basic statistics
    total_messages_sent = models.PositiveIntegerField(default=0)
    total_messages_received = models.PositiveIntegerField(default=0)
    total_conversations = models.PositiveIntegerField(default=0)
    total_groups_joined = models.PositiveIntegerField(default=0)
    total_files_uploaded = models.PositiveIntegerField(default=0)
    total_login_attempts = models.PositiveIntegerField(default=0)
    
    # Activity tracking
    first_activity = models.DateTimeField(null=True, blank=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    total_active_days = models.PositiveIntegerField(default=0)
    
    # Message statistics
    average_message_length = models.FloatField(default=0.0)
    most_active_hour = models.PositiveIntegerField(default=0)  # 0-23
    most_active_day = models.PositiveIntegerField(default=0)   # 0-6 (Monday=0)
    
    # Engagement metrics
    average_session_duration = models.DurationField(null=True, blank=True)
    total_time_spent = models.DurationField(default=timedelta(0))
    average_daily_messages = models.FloatField(default=0.0)
    
    # Social metrics
    total_forwarded_messages = models.PositiveIntegerField(default=0)
    total_replied_messages = models.PositiveIntegerField(default=0)
    total_edited_messages = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'user_analytics'
        verbose_name = 'User Analytics'
        verbose_name_plural = 'User Analytics'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['last_activity']),
            models.Index(fields=['total_messages_sent']),
            models.Index(fields=['average_daily_messages']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.user.username}"
    
    def update_activity(self):
        """Update activity timestamps."""
        now = timezone.now()
        if not self.first_activity:
            self.first_activity = now
        self.last_activity = now
        self.save(update_fields=['first_activity', 'last_activity', 'updated_at'])
    
    def increment_message_count(self, sent=True):
        """Increment message count."""
        field = 'total_messages_sent' if sent else 'total_messages_received'
        UserAnalytics.objects.filter(pk=self.pk).update(
            **{field: models.F(field) + 1}
        )
        self.refresh_from_db()
    
    def increment_file_count(self):
        """Increment uploaded file count."""
        UserAnalytics.objects.filter(pk=self.pk).update(
            total_files_uploaded=models.F('total_files_uploaded') + 1
        )
        self.refresh_from_db()


class ConversationAnalytics(models.Model):
    """
    Model to track conversation analytics and statistics.
    """
    
    conversation = models.OneToOneField(
        'chat.Conversation',
        on_delete=models.CASCADE,
        related_name='analytics'
    )
    
    # Basic statistics
    total_messages = models.PositiveIntegerField(default=0)
    total_participants = models.PositiveIntegerField(default=0)
    total_file_attachments = models.PositiveIntegerField(default=0)
    
    # Activity tracking
    first_message_at = models.DateTimeField(null=True, blank=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    most_active_hour = models.PositiveIntegerField(default=0)  # 0-23
    most_active_day = models.PositiveIntegerField(default=0)   # 0-6
    
    # Message statistics
    average_message_length = models.FloatField(default=0.0)
    total_forwarded_messages = models.PositiveIntegerField(default=0)
    total_edited_messages = models.PositiveIntegerField(default=0)
    total_replied_messages = models.PositiveIntegerField(default=0)
    
    # Engagement metrics
    average_messages_per_day = models.FloatField(default=0.0)
    peak_activity_date = models.DateField(null=True, blank=True)
    peak_activity_count = models.PositiveIntegerField(default=0)
    
    # File statistics
    total_file_size = models.BigIntegerField(default=0)
    most_common_file_type = models.CharField(max_length=20, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'conversation_analytics'
        verbose_name = 'Conversation Analytics'
        verbose_name_plural = 'Conversation Analytics'
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['total_messages']),
            models.Index(fields=['last_message_at']),
            models.Index(fields=['average_messages_per_day']),
        ]
    
    def __str__(self):
        return f"Analytics for {self.conversation}"
    
    def update_message_stats(self, message_length=0):
        """Update conversation analytics when new message is added."""
        now = timezone.now()
        if not self.first_message_at:
            self.first_message_at = now
        
        # Update message count and last activity
        ConversationAnalytics.objects.filter(pk=self.pk).update(
            total_messages=models.F('total_messages') + 1,
            last_message_at=now,
            average_message_length=(
                (models.F('average_message_length') * models.F('total_messages') + message_length) /
                (models.F('total_messages') + 1)
            )
        )
        
        # Handle peak activity tracking
        current_date = now.date()
        if self.peak_activity_date != current_date:
            # Simple peak activity tracking (could be enhanced)
            ConversationAnalytics.objects.filter(pk=self.pk).update(
                peak_activity_date=current_date,
                peak_activity_count=1
            )
        
        self.refresh_from_db()


class SystemAnalytics(models.Model):
    """
    Model to track system-wide analytics and metrics.
    """
    
    # Date this analytics record represents
    date = models.DateField(unique=True)
    
    # User statistics
    total_active_users = models.PositiveIntegerField(default=0)
    new_user_registrations = models.PositiveIntegerField(default=0)
    total_user_logins = models.PositiveIntegerField(default=0)
    
    # Chat statistics
    total_conversations_created = models.PositiveIntegerField(default=0)
    total_messages_sent = models.PositiveIntegerField(default=0)
    total_groups_created = models.PositiveIntegerField(default=0)
    
    # File statistics
    total_files_uploaded = models.PositiveIntegerField(default=0)
    total_file_storage_used = models.BigIntegerField(default=0)
    average_file_size = models.FloatField(default=0.0)
    
    # System performance
    average_response_time = models.FloatField(default=0.0)  # milliseconds
    peak_concurrent_users = models.PositiveIntegerField(default=0)
    total_api_requests = models.PositiveIntegerField(default=0)
    
    # Security metrics
    failed_login_attempts = models.PositiveIntegerField(default=0)
    suspicious_activities = models.PositiveIntegerField(default=0)
    
    # Storage statistics
    database_size = models.BigIntegerField(default=0)
    media_storage_size = models.BigIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'system_analytics'
        verbose_name = 'System Analytics'
        verbose_name_plural = 'System Analytics'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['total_active_users']),
            models.Index(fields=['total_messages_sent']),
        ]
    
    def __str__(self):
        return f"System Analytics for {self.date}"
    
    @classmethod
    def get_or_create_for_date(cls, date=None):
        """Get or create analytics record for a specific date."""
        if date is None:
            date = timezone.now().date()
        
        analytics, created = cls.objects.get_or_create(date=date)
        return analytics, created


class MessageMetrics(models.Model):
    """
    Model to track detailed message metrics and patterns.
    """
    
    # Foreign keys
    message = models.OneToOneField(
        'chat.Message',
        on_delete=models.CASCADE,
        related_name='metrics'
    )
    
    # Message characteristics
    character_count = models.PositiveIntegerField(default=0)
    word_count = models.PositiveIntegerField(default=0)
    has_emoji = models.BooleanField(default=False)
    has_link = models.BooleanField(default=False)
    has_mention = models.BooleanField(default=False)
    
    # Response metrics
    reply_count = models.PositiveIntegerField(default=0)
    forward_count = models.PositiveIntegerField(default=0)
    reaction_count = models.PositiveIntegerField(default=0)
    
    # Engagement metrics
    time_to_first_reply = models.DurationField(null=True, blank=True)
    view_count = models.PositiveIntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'message_metrics'
        verbose_name = 'Message Metrics'
        verbose_name_plural = 'Message Metrics'
        indexes = [
            models.Index(fields=['message']),
            models.Index(fields=['character_count']),
            models.Index(fields=['reply_count']),
            models.Index(fields=['time_to_first_reply']),
        ]
    
    def __str__(self):
        return f"Metrics for message {self.message.id}"
    
    @classmethod
    def create_for_message(cls, message):
        """Create metrics for a new message."""
        content = message.content
        
        # Basic metrics
        character_count = len(content)
        word_count = len(content.split()) if content else 0
        
        # Content analysis
        has_emoji = any(ord(char) > 127 for char in content)
        has_link = 'http' in content.lower() or 'www.' in content.lower()
        has_mention = '@' in content
        
        return cls.objects.create(
            message=message,
            character_count=character_count,
            word_count=word_count,
            has_emoji=has_emoji,
            has_link=has_link,
            has_mention=has_mention
        )


class UserEngagement(models.Model):
    """
    Model to track user engagement patterns and retention.
    """
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='engagement_records'
    )
    
    # Date this engagement record represents
    date = models.DateField()
    
    # Engagement metrics for this date
    sessions_count = models.PositiveIntegerField(default=0)
    total_session_duration = models.DurationField(default=timedelta(0))
    messages_sent = models.PositiveIntegerField(default=0)
    conversations_joined = models.PositiveIntegerField(default=0)
    files_uploaded = models.PositiveIntegerField(default=0)
    
    # Activity pattern
    first_activity_time = models.TimeField(null=True, blank=True)
    last_activity_time = models.TimeField(null=True, blank=True)
    active_hours_count = models.PositiveIntegerField(default=0)  # Number of hours with activity
    
    # Engagement score (calculated metric)
    engagement_score = models.FloatField(default=0.0)
    
    class Meta:
        db_table = 'user_engagement'
        verbose_name = 'User Engagement'
        verbose_name_plural = 'User Engagement'
        unique_together = ['user', 'date']
        ordering = ['-date']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['date']),
            models.Index(fields=['engagement_score']),
        ]
    
    def __str__(self):
        return f"Engagement for {self.user.username} on {self.date}"
    
    @classmethod
    def get_or_create_for_user_date(cls, user, date=None):
        """Get or create engagement record for a user and date."""
        if date is None:
            date = timezone.now().date()
        
        engagement, created = cls.objects.get_or_create(
            user=user,
            date=date
        )
        return engagement, created
    
    def calculate_engagement_score(self):
        """Calculate and update engagement score."""
        # Simple engagement scoring algorithm
        score = 0.0
        
        # Session-based scoring
        if self.sessions_count > 0:
            score += min(self.sessions_count * 10, 50)  # Max 50 points for sessions
        
        # Message-based scoring
        if self.messages_sent > 0:
            score += min(self.messages_sent * 2, 30)  # Max 30 points for messages
        
        # Activity duration scoring
        if self.total_session_duration.total_seconds() > 0:
            hours = self.total_session_duration.total_seconds() / 3600
            score += min(hours * 5, 25)  # Max 25 points for activity time
        
        # Consistency bonus (active hours)
        if self.active_hours_count > 0:
            score += min(self.active_hours_count * 2, 20)  # Max 20 points for consistency
        
        self.engagement_score = min(score, 100.0)  # Cap at 100
        self.save(update_fields=['engagement_score'])


class PerformanceMetrics(models.Model):
    """
    Model to track system performance and response times.
    """
    
    class MetricType(models.TextChoices):
        API_RESPONSE_TIME = 'api_response_time', 'API Response Time'
        DATABASE_QUERY_TIME = 'database_query_time', 'Database Query Time'
        WEBSOCKET_LATENCY = 'websocket_latency', 'WebSocket Latency'
        FILE_UPLOAD_TIME = 'file_upload_time', 'File Upload Time'
        MESSAGE_DELIVERY_TIME = 'message_delivery_time', 'Message Delivery Time'
    
    class MetricCategory(models.TextChoices):
        AUTHENTICATION = 'authentication', 'Authentication'
        USER_MANAGEMENT = 'user_management', 'User Management'
        CHAT_MESSAGES = 'chat_messages', 'Chat Messages'
        FILE_OPERATIONS = 'file_operations', 'File Operations'
        ADMIN_OPERATIONS = 'admin_operations', 'Admin Operations'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Metric details
    metric_type = models.CharField(max_length=30, choices=MetricType.choices)
    category = models.CharField(max_length=30, choices=MetricCategory.choices)
    
    # Value and context
    value = models.FloatField()  # Response time in milliseconds
    context = models.JSONField(default=dict, blank=True)  # Additional context
    
    # Request details
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    endpoint = models.CharField(max_length=200, blank=True)
    method = models.CharField(max_length=10, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'performance_metrics'
        verbose_name = 'Performance Metric'
        verbose_name_plural = 'Performance Metrics'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['metric_type']),
            models.Index(fields=['category']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['value']),
        ]
    
    def __str__(self):
        return f"{self.metric_type} - {self.value}ms at {self.timestamp}"
