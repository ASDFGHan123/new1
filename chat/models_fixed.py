"""
Chat models for OffChat application - FIXED
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
import uuid

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    Image = None


class Group(models.Model):
    class GroupType(models.TextChoices):
        PRIVATE = 'private', 'Private'
        PUBLIC = 'public', 'Public'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    description = models.TextField(max_length=500, blank=True)
    avatar = models.ImageField(upload_to='group_avatars/', blank=True, null=True)
    group_type = models.CharField(max_length=10, choices=GroupType.choices, default=GroupType.PUBLIC)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_groups')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_activity = models.DateTimeField(null=True, blank=True)
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
        return self.members.filter(status='active').count()
    
    @property
    def is_private(self):
        return self.group_type == self.GroupType.PRIVATE
    
    def add_member(self, user, role='member'):
        member, created = GroupMember.objects.get_or_create(group=self, user=user, defaults={'role': role})
        if not created and member.status != 'active':
            member.status = 'active'
            member.save()
        return member
    
    def remove_member(self, user):
        try:
            member = self.members.get(user=user)
            member.status = 'left'
            member.save()
            return True
        except GroupMember.DoesNotExist:
            return False
    
    def is_member(self, user):
        return self.members.filter(user=user, status='active').exists()
    
    def get_member_role(self, user):
        try:
            member = self.members.get(user=user)
            return member.role
        except GroupMember.DoesNotExist:
            return None
    
    def can_manage(self, user):
        role = self.get_member_role(user)
        return role in ['admin', 'owner']
    
    def update_activity(self):
        self.last_activity = timezone.now()
        self.save(update_fields=['last_activity'])
    
    def soft_delete(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])


class GroupMember(models.Model):
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
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='group_memberships')
    role = models.CharField(max_length=20, choices=MemberRole.choices, default=MemberRole.MEMBER)
    status = models.CharField(max_length=20, choices=MemberStatus.choices, default=MemberStatus.ACTIVE)
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
        self.role = self.MemberRole.ADMIN
        self.save(update_fields=['role'])
    
    def make_moderator(self):
        self.role = self.MemberRole.MODERATOR
        self.save(update_fields=['role'])
    
    def make_member(self):
        self.role = self.MemberRole.MEMBER
        self.save(update_fields=['role'])
    
    def kick_user(self):
        self.status = self.MemberStatus.KICKED
        self.save(update_fields=['status'])
    
    def ban_user(self):
        self.status = self.MemberStatus.BANNED
        self.save(update_fields=['status'])
    
    def reactivate(self):
        self.status = self.MemberStatus.ACTIVE
        self.save(update_fields=['status'])


class Conversation(models.Model):
    class ConversationType(models.TextChoices):
        INDIVIDUAL = 'individual', 'Individual'
        GROUP = 'group', 'Group'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation_type = models.CharField(max_length=20, choices=ConversationType.choices, default=ConversationType.INDIVIDUAL)
    group = models.OneToOneField(Group, on_delete=models.CASCADE, null=True, blank=True, related_name='conversation')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, through='ConversationParticipant', related_name='conversations')
    title = models.CharField(max_length=100, blank=True)
    description = models.TextField(blank=True)
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
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
            return f"Group: {self.group.name}" if self.group else "Group: Unknown"
        else:
            participants = self.participants.all()
            if participants.count() == 2:
                return f"Individual: {', '.join([p.username for p in participants])[:50]}"
            return f"Individual conversation ({participants.count()} participants)"
    
    @property
    def participant_count(self):
        if self.conversation_type == self.ConversationType.GROUP:
            return self.group.member_count if self.group else 0
        return self.participants.count()
    
    @property
    def last_message(self):
        return self.messages.filter(is_deleted=False).order_by('-timestamp').first()
    
    def add_participant(self, user):
        if self.conversation_type == self.ConversationType.INDIVIDUAL:
            if self.participants.count() >= 2:
                return False
            if self.participants.filter(id=user.id).exists():
                return False
            ConversationParticipant.objects.create(conversation=self, user=user)
            return True
        return False
    
    def remove_participant(self, user):
        if self.conversation_type == self.ConversationType.INDIVIDUAL:
            try:
                participant = self.participants.get(id=user.id)
                participant.delete()
                return True
            except ConversationParticipant.DoesNotExist:
                return False
        return False
    
    def is_participant(self, user):
        if self.conversation_type == self.ConversationType.GROUP:
            return self.group.is_member(user) if self.group else False
        return self.participants.filter(id=user.id).exists()
    
    def update_activity(self):
        self.last_message_at = timezone.now()
        self.save(update_fields=['last_message_at'])
        if self.conversation_type == self.ConversationType.GROUP and self.group:
            self.group.update_activity()
    
    def soft_delete(self):
        now = timezone.now()
        self.messages.update(is_deleted=True, deleted_at=now)
        self.is_deleted = True
        self.deleted_at = now
        self.save(update_fields=['is_deleted', 'deleted_at'])


class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)
    last_read_at = models.DateTimeField(null=True, blank=True)
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
        self.last_read_at = timezone.now()
        self.unread_count = 0
        self.save(update_fields=['last_read_at', 'unread_count'])
    
    def increment_unread_count(self):
        ConversationParticipant.objects.filter(pk=self.pk).update(unread_count=models.F('unread_count') + 1)
        self.refresh_from_db()


class Message(models.Model):
    class MessageType(models.TextChoices):
        TEXT = 'text', 'Text'
        IMAGE = 'image', 'Image'
        FILE = 'file', 'File'
        AUDIO = 'audio', 'Audio'
        VIDEO = 'video', 'Video'
        SYSTEM = 'system', 'System'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_messages')
    content = models.TextField()
    message_type = models.CharField(max_length=20, choices=MessageType.choices, default=MessageType.TEXT)
    reply_to = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
    forwarded_from = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='forwards')
    is_edited = models.BooleanField(default=False)
    edited_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
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
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            self.conversation.update_activity()
        if not is_new and self.is_edited and not self.edited_at:
            self.edited_at = timezone.now()
            Message.objects.filter(pk=self.pk).update(edited_at=self.edited_at)
    
    def edit_content(self, new_content):
        self.content = new_content
        self.is_edited = True
        self.edited_at = timezone.now()
        self.save(update_fields=['content', 'is_edited', 'edited_at'])
    
    def delete_message(self):
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_deleted', 'deleted_at'])
    
    def restore_message(self):
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_deleted', 'deleted_at'])
    
    def forward_to(self, target_conversation):
        forwarded_message = Message.objects.create(
            conversation=target_conversation,
            sender=self.sender,
            content=self.content,
            message_type=self.message_type,
            forwarded_from=self
        )
        return forwarded_message
    
    def reply_to_message(self, content, message_type=MessageType.TEXT):
        reply = Message.objects.create(
            conversation=self.conversation,
            sender=self.sender,
            content=content,
            message_type=message_type,
            reply_to=self
        )
        return reply


class Attachment(models.Model):
    class FileType(models.TextChoices):
        IMAGE = 'image', 'Image'
        DOCUMENT = 'document', 'Document'
        AUDIO = 'audio', 'Audio'
        VIDEO = 'video', 'Video'
        OTHER = 'other', 'Other'
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='attachments/%Y/%m/%d/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=20, choices=FileType.choices)
    file_size = models.PositiveIntegerField()
    mime_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    duration = models.PositiveIntegerField(null=True, blank=True)
    thumbnail = models.ImageField(upload_to='thumbnails/%Y/%m/%d/', null=True, blank=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    bitrate = models.PositiveIntegerField(null=True, blank=True)
    codec = models.CharField(max_length=50, blank=True)
    
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
        return round(self.file_size / (1024 * 1024), 2)
    
    @property
    def is_image(self):
        return self.file_type == self.FileType.IMAGE
    
    @property
    def is_audio(self):
        return self.file_type == self.FileType.AUDIO
    
    @property
    def is_video(self):
        return self.file_type == self.FileType.VIDEO
    
    @property
    def is_document(self):
        return self.file_type == self.FileType.DOCUMENT
    
    @property
    def video_dimensions(self):
        if self.is_video and self.width and self.height:
            return (self.width, self.height)
        return None
    
    @property
    def duration_formatted(self):
        if not self.duration:
            return None
        minutes = self.duration // 60
        seconds = self.duration % 60
        return f"{minutes}:{seconds:02d}"
