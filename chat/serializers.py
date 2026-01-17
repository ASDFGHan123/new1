"""
Serializers for chat app - FIXED VERSION 2
"""
from rest_framework import serializers
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import Group, GroupMember, Conversation, ConversationParticipant, Message, Attachment
from users.serializers import UserSerializer

User = get_user_model()


class GroupMemberSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = GroupMember
        fields = ['id', 'user', 'role', 'status', 'joined_at', 'last_activity']
        read_only_fields = ['id', 'joined_at']


class GroupSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField()
    member_count = serializers.ReadOnlyField()
    is_private = serializers.ReadOnlyField()
    can_manage = serializers.SerializerMethodField()
    members = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'description', 'avatar', 'group_type', 'created_by',
                  'created_at', 'updated_at', 'last_activity', 'is_deleted', 'deleted_at',
                  'member_count', 'is_private', 'can_manage', 'members']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'last_activity',
                            'is_deleted', 'deleted_at']
    
    def get_can_manage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_manage(request.user)
        return False
    
    def get_members(self, obj):
        try:
            members = obj.members.filter(status='active')
            return GroupMemberSerializer(members, many=True).data
        except Exception:
            return []


class GroupCreateSerializer(serializers.ModelSerializer):
    member_ids = serializers.ListField(child=serializers.CharField(), required=False,
                                       write_only=True, allow_empty=True)
    
    class Meta:
        model = Group
        fields = ['name', 'description', 'group_type', 'avatar', 'member_ids']
    
    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        validated_data['created_by'] = self.context['request'].user
        group = Group.objects.create(**validated_data)
        group.add_member(self.context['request'].user, 'owner')
        
        for member_id in member_ids:
            try:
                user = User.objects.get(id=member_id)
                group.add_member(user)
            except User.DoesNotExist:
                continue
        
        Conversation.objects.create(conversation_type='group', group=group,
                                   title=group.name, description=group.description)
        return group


class ConversationParticipantSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    
    class Meta:
        model = ConversationParticipant
        fields = ['id', 'user', 'joined_at', 'last_read_at', 'unread_count']
        read_only_fields = ['id', 'joined_at']


class AttachmentSerializer(serializers.ModelSerializer):
    message = serializers.StringRelatedField()
    file_size_mb = serializers.ReadOnlyField()
    is_image = serializers.ReadOnlyField()
    is_audio = serializers.ReadOnlyField()
    is_video = serializers.ReadOnlyField()
    is_document = serializers.ReadOnlyField()
    url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    video_dimensions = serializers.ReadOnlyField()
    duration_formatted = serializers.ReadOnlyField()
    
    class Meta:
        model = Attachment
        fields = ['id', 'message', 'file', 'file_name', 'file_type', 'file_size',
                  'mime_type', 'duration', 'uploaded_at', 'file_size_mb',
                  'is_image', 'is_audio', 'is_video', 'is_document', 'url',
                  'thumbnail', 'thumbnail_url', 'width', 'height', 'bitrate', 'codec',
                  'video_dimensions', 'duration_formatted']
        read_only_fields = ['id', 'uploaded_at', 'file_size_mb', 'is_image', 'is_audio',
                            'is_video', 'is_document', 'url', 'thumbnail_url', 'video_dimensions',
                            'duration_formatted']
    
    def get_url(self, obj):
        request = self.context.get('request')
        if obj.file and hasattr(obj.file, 'url'):
            url = obj.file.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None
    
    def get_thumbnail_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail and hasattr(obj.thumbnail, 'url'):
            url = obj.thumbnail.url
            if request:
                return request.build_absolute_uri(url)
            return url
        return None


class MessageSerializer(serializers.ModelSerializer):
    sender = serializers.StringRelatedField()
    reply_to = serializers.StringRelatedField()
    forwarded_from = serializers.StringRelatedField()
    attachments = AttachmentSerializer(many=True, read_only=True)
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'content', 'message_type',
                  'reply_to', 'forwarded_from', 'is_edited', 'edited_at',
                  'is_deleted', 'deleted_at', 'timestamp', 'attachments']
        read_only_fields = ['id', 'sender', 'is_edited', 'edited_at', 'is_deleted',
                            'deleted_at', 'timestamp', 'attachments']


class MessageCreateSerializer(serializers.ModelSerializer):
    attachments = serializers.ListField(child=serializers.FileField(), required=False, write_only=True)
    content = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Message
        fields = ['content', 'message_type', 'reply_to', 'forwarded_from', 'attachments']
    
    def create(self, validated_data):
        attachments = validated_data.pop('attachments', [])
        validated_data['sender'] = self.context['request'].user
        validated_data['conversation_id'] = self.context['conversation_id']
        message = super().create(validated_data)
        
        for file in attachments:
            file_type = 'image' if file.content_type.startswith('image/') else 'document'
            attachment = Attachment.objects.create(message=message, file=file, file_name=file.name,
                                                  file_type=file_type, file_size=file.size,
                                                  mime_type=file.content_type)
        return message


class MessageUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['content']
    
    def validate(self, attrs):
        if self.instance.sender != self.context['request'].user:
            raise serializers.ValidationError("You can only edit your own messages.")
        return attrs


class ConversationSerializer(serializers.ModelSerializer):
    group = GroupSerializer(read_only=True)
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    participant_count = serializers.ReadOnlyField()
    message_count = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'conversation_type', 'group', 'title', 'description',
                  'last_message_at', 'conversation_status', 'is_active', 'created_at', 'updated_at', 'is_deleted', 'deleted_at',
                  'participant_count', 'participants', 'last_message', 'message_count']
        read_only_fields = ['id', 'last_message_at', 'conversation_status', 'created_at', 'updated_at',
                            'is_deleted', 'deleted_at']
    
    def get_participants(self, obj):
        try:
            if obj.conversation_type == 'group':
                if not obj.group:
                    return []
                members = obj.group.members.filter(status='active')
                result = []
                for m in members:
                    try:
                        result.append({
                            'id': str(m.user.id),
                            'username': m.user.username or m.user.first_name or m.user.email.split('@')[0] or 'Unknown',
                            'avatar': m.user.avatar.url if m.user.avatar else None,
                            'status': 'online'
                        })
                    except Exception:
                        continue
                return result
            else:
                participants = obj.participants.all()
                result = []
                for p in participants:
                    try:
                        result.append({
                            'id': str(p.id),
                            'username': p.username or p.first_name or p.email.split('@')[0] or 'Unknown',
                            'avatar': p.avatar.url if p.avatar else None,
                            'status': getattr(p, 'online_status', 'offline')
                        })
                    except Exception:
                        continue
                return result
        except Exception:
            return []
    
    def get_last_message(self, obj):
        last_msg = obj.last_message
        if last_msg:
            return MessageSerializer(last_msg).data
        return None
    
    def get_message_count(self, obj):
        return obj.messages.filter(is_deleted=False).count()
    
    def get_is_active(self, obj):
        return obj.is_active()


class ConversationCreateSerializer(serializers.ModelSerializer):
    participant_ids = serializers.ListField(child=serializers.IntegerField(),
                                           required=False, write_only=True)
    group_data = serializers.DictField(required=False, write_only=True)
    
    class Meta:
        model = Conversation
        fields = ['conversation_type', 'title', 'description', 'participant_ids', 'group_data']
    
    def validate(self, attrs):
        conversation_type = attrs.get('conversation_type', 'individual')
        if conversation_type == 'individual':
            participant_ids = attrs.get('participant_ids', [])
            if len(participant_ids) > 1:
                raise serializers.ValidationError("Individual conversations can only have 2 participants.")
        elif conversation_type == 'group':
            if 'group_data' not in attrs:
                raise serializers.ValidationError("Group data is required for group conversations.")
        return attrs
    
    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        group_data = validated_data.pop('group_data', None)
        conversation = Conversation.objects.create(**validated_data)
        
        if conversation.conversation_type == 'group' and group_data:
            group_data['created_by'] = self.context['request'].user
            group = Group.objects.create(**group_data)
            conversation.group = group
            conversation.save()
            group.add_member(self.context['request'].user, 'owner')
            for participant_id in participant_ids:
                try:
                    user = User.objects.get(id=participant_id)
                    group.add_member(user)
                except User.DoesNotExist:
                    continue
        else:
            request_user = self.context['request'].user
            conversation.add_participant(request_user)
            for participant_id in participant_ids:
                try:
                    user = User.objects.get(id=participant_id)
                    conversation.add_participant(user)
                except User.DoesNotExist:
                    continue
        return conversation


class SearchSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=255)
    conversations = ConversationSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    groups = GroupSerializer(many=True, read_only=True)
    users = UserSerializer(many=True, read_only=True)
