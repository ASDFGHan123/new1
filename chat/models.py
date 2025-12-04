"""
Chat models for OffChat application.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
import uuid

# Optional PIL import for image processing
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    Image = None

User = get_user_model()


class Group(models.Model):
    """
    Model for group chats with member management.
    """
    
    class GroupType(models.TextChoices):
        PRIVATE = 'private', 'Private'
        PUBLIC = 'public', 'Public'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='group_avatars/', blank=True, null=True)
    group_type = models.CharField(
        max_length=10, 
        choices=GroupType.choices, 
        default=GroupType.PUBLIC
    )
    
    # Creator and timestamps
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Activity tracking
    last_activity = models.DateTimeField(null=True, blank=True)
    
    # Soft deletion
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'groups'
        verbose_name = 'Group'
        verbose_name_plural = 'Groups'
        ordering = ['-last_activity', '-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['group_type']),
            models.Index(fields=['created_by']),
            models.Index(fields=['last_activity']),
            models.Index(fields=['is_deleted']),
        ]
    
    def __str__(self):
        return self.name
    
    @property
    def member_count(self):
        """Get the number of active members in the group."""
        return self.members.filter(status='active').count()
    
    @property
    def is_private(self):
        """Check if group is private."""
        return self.group_type == self.GroupType.PRIVATE
    
    def add_member(self, user, role='member'):
        """Add a member to the group."""
        member, created = GroupMember.objects.get_or_create(
            group=self,
            user=user,
            defaults={'role': role}
        )
        if not created and member.status != 'active':
            member.status = 'active'
            member.save()
        return member
    
    def remove_member(self, user):
        """Remove a member from the group."""
        try:
            member = self.members.get(user=user)
            member.status = 'left'
            member.save()
            return True
        except GroupMember.DoesNotExist:
            return False
    
    def is_member(self, user):
        """Check if user is a member of the group."""
        return self.members.filter(user=user, status='active').exists()
    
    def get_member_role(self, user):
        """Get the role of a user in the group."""
        try:
            member = self.members.get(user=user)
            return member.role
        except GroupMember.DoesNotExist:
            return None
    
    def can_manage(self, user):
        """Check if user can manage the group (admin or owner)."""
        role = self.get_member_role(user)
        return role in ['admin', 'owner']
    
    def update_activity(self):
        """Update the last activity timestamp."""
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])
    
    def soft_delete(self):
        """Soft delete the group."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])


class GroupMember(models.Model):
    """
    Model for group membership management.
    """
    
    class MemberRole(models.TextChoices):
        OWNER = 'owner', 'Owner'
        ADMIN = 'admin', 'Admin'
        MODERATOR = 'moderator', 'Moderator'
        MEMBER = 'member', 'Member'
    
    class MemberStatus(models.TextChoices):
        ACTIVE = 'active', 'Active'
        LEFT = 'left', 'Left'
        KICKED = 'kicked', 'Kicked'
        BANNED = 'banned', 'Banned'
    
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships')
    role = models.CharField(max_length=20, choices=MemberRole.choices, default=MemberRole.MEMBER)
    status = models.CharField(max_length=20, choices=MemberStatus.choices, default=MemberStatus.ACTIVE)
    
    # Timestamps
    joined_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'group_members'
        verbose_name = 'Group Member'
        verbose_name_plural = 'Group Members'
        unique_together = ['group', 'user']
        ordering = ['-joined_at']
        indexes = [
            models.Index(fields=['group']),
            models.Index(fields=['user']),
            models.Index(fields=['role']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.user.username} in {self.group.name}"
    
    def make_admin(self):
        """Make user an admin of the group."""
        self.role = self.MemberRole.ADMIN
        self.save(update_fields=['role'])
    
    def make_moderator(self):
        """Make user a moderator of the group."""
        self.role = self.MemberRole.MODERATOR
        self.save(update_fields=['role'])
    
    def make_member(self):
        """Make user a regular member."""
        self.role = self.MemberRole.MEMBER
        self.save(update_fields=['role'])
    
    def kick_user(self):
        """Kick user from the group."""
        self.status = self.MemberStatus.KICKED
        self.save(update_fields=['status'])
    
    def ban_user(self):
        """Ban user from the group."""
        self.status = self.MemberStatus.BANNED
        self.save(update_fields=['status'])
    
    def reactivate(self):
        """Reactivate user in the group."""
        self.status = self.MemberStatus.ACTIVE
        self.save(update_fields=['status'])


class Conversation(models.Model):
    """
    Model for individual and group conversations.
    """
    
    class ConversationType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual'
        GROUP = 'group', 'Group'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation_type = models.CharField(
        max_length=20, 
        choices=ConversationType.choices, 
        default=ConversationType.INDIVIDUAL
    )
    
    # For group conversations
    group = models.OneToOneField(
        Group, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='conversation'
    )
    
    # For individual conversations - participants
    participants = models.ManyToManyField(
        User, 
        through='ConversationParticipant',
        related_name='conversations'
    )
    
    # Conversation metadata
    title = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    
    # Activity tracking
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Soft deletion
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'conversations'
        verbose_name = 'Conversation'
        verbose_name_plural = 'Conversations'
        ordering = ['-last_message_at', '-created_at']
        indexes = [
            models.Index(fields=['conversation_type']),
            models.Index(fields=['last_message_at']),
            models.Index(fields=['created_at']),
            models.Index(fields=['is_deleted']),
        ]
    
    def __str__(self):
        if self.conversation_type == self.ConversationType.GROUP:
            return f"Group: {self.group.name}"
        else:
            participants = self.participants.all()
            if participants.count() == 2:
                return f"Individual: {', '.join([p.username for p in participants])[:50]}"
            return f"Individual conversation ({participants.count()} participants)"
    
    @property
    def participant_count(self):
        """Get the number of participants in the conversation."""
        if self.conversation_type == self.ConversationType.GROUP:
            return self.group.member_count if self.group else 0
        return self.participants.count()
    
    @property
    def last_message(self):
        """Get the last message in the conversation."""
        return self.messages.filter(is_deleted=False).order_by('-timestamp').first()
    
    def add_participant(self, user):
        """Add a participant to the conversation."""
        if self.conversation_type == self.ConversationType.INDIVIDUAL:
            if self.participants.count() >= 2:
                return False  # Individual conversations only support 2 participants
            
            if self.participants.filter(id=user.id).exists():
                return False  # Already a participant
            
            ConversationParticipant.objects.create(
                conversation=self,
                user=user
            )
            return True
        return False
    
    def remove_participant(self, user):
        """Remove a participant from the conversation."""
        if self.conversation_type == self.ConversationType.INDIVIDUAL:
            try:
                participant = self.participants.get(id=user.id)
                participant.delete()
                return True
            except ConversationParticipant.DoesNotExist:
                return False
        return False
    
    def is_participant(self, user):
        """Check if user is a participant in the conversation."""
        if self.conversation_type == self.ConversationType.GROUP:
            return self.group.is_member(user)
        return self.participants.filter(id=user.id).exists()
    
    def update_activity(self):
        """Update the conversation's activity timestamp."""
        self.last_message_at = timezone.now()
        self.save(update_fields=['last_message_at'])
        
        if self.conversation_type == self.ConversationType.GROUP and self.group:
            self.group.update_activity()
    
    def soft_delete(self):
        """Soft delete the conversation."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])
        
        # Soft delete all messages in the conversation
        self.messages.update(is_deleted=True, deleted_at=timezone.now())


class ConversationParticipant(models.Model):
    """
    Through model for conversation participants.
    """
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Participation metadata
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
    
    # Unread message count
    unread_count = models.PositiveIntegerField(default=0)
    
    class Meta:
        db_table = 'conversation_participants'
        verbose_name = 'Conversation Participant'
        verbose_name_plural = 'Conversation Participants'
        unique_together = ['conversation', 'user']
        ordering = ['joined_at']
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['user']),
            models.Index(fields=['last_read_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} in {self.conversation}"
    
    def mark_as_read(self):
        """Mark conversation as read for this participant."""
        self.last_read_at = timezone.now()
        self.unread_count = 0
        self.save(update_fields=['last_read_at', 'unread_count'])
    
    def increment_unread_count(self):
        """Increment unread message count."""
        ConversationParticipant.objects.filter(
            pk=self.pk
        ).update(
            unread_count=models.F('unread_count') + 1
        )
        self.refresh_from_db()


class Message(models.Model):
    """
    Model for chat messages with editing and deletion support.
    """
    
    class MessageType(models.TextChoices):
        TEXT = 'text', 'Text'
        IMAGE = 'image', 'Image'
        FILE = 'file', 'File'
        AUDIO = 'audio', 'Audio'
        VIDEO = 'video', 'Video'
        SYSTEM = 'system', 'System'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    
    # Message content
    content = models.TextField()
    message_type = models.CharField(
        max_length=20, 
        choices=MessageType.choices, 
        default=MessageType.TEXT
    )
    
    # Message threading
    reply_to = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        related_name='replies'
    )
    
    # Message forwarding
    forwarded_from = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='forwards'
    )
    
    # Message editing and deletion
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'messages'
        verbose_name = 'Message'
        verbose_name_plural = 'Messages'
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['sender']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['message_type']),
            models.Index(fields=['is_deleted']),
            models.Index(fields=['reply_to']),
        ]
    
    def __str__(self):
        return f"Message from {self.sender.username} at {self.timestamp}"
    
    def save(self, *args, **kwargs):
        """Override save to update conversation activity and sender's message count."""
        is_new = self.pk is None
        
        super().save(*args, **kwargs)
        
        # Update conversation activity
        if is_new:
            self.conversation.update_activity()
            
            # Increment sender's message count
            self.sender.increment_message_count()
        
        # Handle message editing
        if not is_new and self.is_edited and not self.edited_at:
            self.edited_at = timezone.now()
            Message.objects.filter(pk=self.pk).update(edited_at=self.edited_at)
    
    def edit_content(self, new_content):
        """Edit the message content."""
        self.content = new_content
        self.is_edited = True
        self.edited_at = timezone.now()
        self.save(update_fields=['content', 'is_edited', 'edited_at'])
    
    def delete_message(self):
        """Soft delete the message."""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])
    
    def restore_message(self):
        """Restore a soft-deleted message."""
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])
    
    def forward_to(self, target_conversation):
        """Forward this message to another conversation."""
        forwarded_message = Message.objects.create(
            conversation=target_conversation,
            sender=self.sender,
            content=self.content,
            message_type=self.message_type,
            forwarded_from=self
        )
        return forwarded_message
    
    def reply_to_message(self, content, message_type=MessageType.TEXT):
        """Create a reply to this message."""
        reply = Message.objects.create(
            conversation=self.conversation,
            sender=self.sender,
            content=content,
            message_type=message_type,
            reply_to=self
        )
        return reply


class Attachment(models.Model):
    """
    Model for file attachments in messages.
    """
    
    class FileType(models.TextChoices):
        IMAGE = 'image', 'Image'
        DOCUMENT = 'document', 'Document'
        AUDIO = 'audio', 'Audio'
        VIDEO = 'video', 'Video'
        OTHER = 'other', 'Other'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    
    # File information
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FileType.choices)
    file_size = models.PositiveIntegerField()  # Size in bytes
    
    # Metadata
    mime_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # For audio/video files
    duration = models.PositiveIntegerField(null=True, blank=True)  # Duration in seconds
    
    class Meta:
        db_table = 'attachments'
        verbose_name = 'Attachment'
        verbose_name_plural = 'Attachments'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['message']),
            models.Index(fields=['file_type']),
            models.Index(fields=['uploaded_at']),
        ]
    
    def __str__(self):
        return f"{self.file_name} ({self.file_size} bytes)"
    
    @property
    def file_size_mb(self):
        """Get file size in MB."""
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def is_image(self):
        """Check if attachment is an image."""
        return self.file_type == self.FileType.IMAGE
    
    @property
    def is_audio(self):
        """Check if attachment is an audio file."""
        return self.file_type == self.FileType.AUDIO
    
    @property
    def is_video(self):
        """Check if attachment is a video file."""
        return self.file_type == self.FileType.VIDEO
    
    @property
    def is_document(self):
        """Check if attachment is a document."""
        return self.file_type == self.FileType.DOCUMENT
