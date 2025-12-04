"""
Serializers for chat app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Group, GroupMember, Conversation, ConversationParticipant, Message, Attachment
from users.serializers import UserSerializer

User = get_user_model()


class GroupMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for GroupMember model.
    """
    user = serializers.StringRelatedField()
    
    class Meta:
        model = GroupMember
        fields = [
            'id', 'user', 'role', 'status', 'joined_at', 'last_activity'
        ]
        read_only_fields = ['id', 'joined_at']


class GroupSerializer(serializers.ModelSerializer):
    """
    Serializer for Group model.
    """
    created_by = serializers.StringRelatedField()
    members = GroupMemberSerializer(source='members.filter', many=True, read_only=True)
    member_count = serializers.ReadOnlyField()
    is_private = serializers.ReadOnlyField()
    can_manage = serializers.SerializerMethodField()
    
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'avatar', 'group_type', 'created_by',
            'created_at', 'updated_at', 'last_activity', 'is_deleted', 'deleted_at',
            'member_count', 'is_private', 'can_manage', 'members'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_at', 'updated_at', 'last_activity',
            'is_deleted', 'deleted_at'
        ]
    
    def get_can_manage(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.can_manage(request.user)
        return False


class GroupCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating groups.
    """
    member_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True
    )
    
    class Meta:
        model = Group
        fields = ['name', 'description', 'group_type', 'avatar', 'member_ids']
    
    def create(self, validated_data):
        member_ids = validated_data.pop('member_ids', [])
        group = Group.objects.create(**validated_data)
        
        # Add creator as owner
        group.add_member(self.context['request'].user, 'owner')
        
        # Add other members if provided
        for member_id in member_ids:
            try:
                user = User.objects.get(id=member_id)
                group.add_member(user)
            except User.DoesNotExist:
                continue
        
        return group


class ConversationParticipantSerializer(serializers.ModelSerializer):
    """
    Serializer for ConversationParticipant model.
    """
    user = serializers.StringRelatedField()
    
    class Meta:
        model = ConversationParticipant
        fields = [
            'id', 'user', 'joined_at', 'last_read_at', 'unread_count'
        ]
        read_only_fields = ['id', 'joined_at']


class MessageSerializer(serializers.ModelSerializer):
    """
    Serializer for Message model.
    """
    sender = serializers.StringRelatedField()
    reply_to = serializers.StringRelatedField()
    forwarded_from = serializers.StringRelatedField()
    
    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'content', 'message_type',
            'reply_to', 'forwarded_from', 'is_edited', 'edited_at',
            'is_deleted', 'deleted_at', 'timestamp'
        ]
        read_only_fields = [
            'id', 'sender', 'is_edited', 'edited_at', 'is_deleted',
            'deleted_at', 'timestamp'
        ]


class MessageCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating messages.
    """
    
    class Meta:
        model = Message
        fields = ['content', 'message_type', 'reply_to', 'forwarded_from']
    
    def create(self, validated_data):
        validated_data['sender'] = self.context['request'].user
        validated_data['conversation_id'] = self.context['conversation_id']
        return super().create(validated_data)


class MessageUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating messages.
    """
    
    class Meta:
        model = Message
        fields = ['content']
    
    def validate(self, attrs):
        # Check if user can edit this message
        if self.instance.sender != self.context['request'].user:
            raise serializers.ValidationError("You can only edit your own messages.")
        return attrs


class ConversationSerializer(serializers.ModelSerializer):
    """
    Serializer for Conversation model.
    """
    group = GroupSerializer(read_only=True)
    participants = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    participant_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 'conversation_type', 'group', 'title', 'description',
            'last_message_at', 'created_at', 'updated_at', 'is_deleted', 'deleted_at',
            'participant_count', 'participants', 'last_message'
        ]
        read_only_fields = [
            'id', 'last_message_at', 'created_at', 'updated_at',
            'is_deleted', 'deleted_at'
        ]
    
    def get_participants(self, obj):
        if obj.conversation_type == 'group':
            return obj.group.members.filter(status='active').values_list('user_id', flat=True)
        else:
            return obj.participants.values_list('id', flat=True)
    
    def get_last_message(self, obj):
        last_msg = obj.last_message
        if last_msg:
            return MessageSerializer(last_msg).data
        return None


class ConversationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating conversations.
    """
    participant_ids = serializers.ListField(
        child=serializers.UUIDField(),
        required=False,
        write_only=True
    )
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
            # Create group and link to conversation
            group_data['created_by'] = self.context['request'].user
            group = Group.objects.create(**group_data)
            conversation.group = group
            conversation.save()
            
            # Add creator as owner
            group.add_member(self.context['request'].user, 'owner')
            
            # Add participants if provided
            for participant_id in participant_ids:
                try:
                    user = User.objects.get(id=participant_id)
                    group.add_member(user)
                except User.DoesNotExist:
                    continue
        else:
            # Add participants to individual conversation
            request_user = self.context['request'].user
            conversation.add_participant(request_user)
            
            for participant_id in participant_ids:
                try:
                    user = User.objects.get(id=participant_id)
                    conversation.add_participant(user)
                except User.DoesNotExist:
                    continue
        
        return conversation


class AttachmentSerializer(serializers.ModelSerializer):
    """
    Serializer for Attachment model.
    """
    message = serializers.StringRelatedField()
    file_size_mb = serializers.ReadOnlyField()
    is_image = serializers.ReadOnlyField()
    is_audio = serializers.ReadOnlyField()
    is_video = serializers.ReadOnlyField()
    is_document = serializers.ReadOnlyField()
    
    class Meta:
        model = Attachment
        fields = [
            'id', 'message', 'file', 'file_name', 'file_type', 'file_size',
            'mime_type', 'duration', 'uploaded_at', 'file_size_mb',
            'is_image', 'is_audio', 'is_video', 'is_document'
        ]
        read_only_fields = [
            'id', 'uploaded_at', 'file_size_mb', 'is_image', 'is_audio',
            'is_video', 'is_document'
        ]


class AttachmentCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating attachments.
    """
    
    class Meta:
        model = Attachment
        fields = ['file', 'file_type', 'duration']
    
    def validate_file(self, value):
        # File size validation (10MB limit)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("File size cannot exceed 10MB.")
        return value
    
    def create(self, validated_data):
        message_id = self.context['message_id']
        validated_data['message_id'] = message_id
        
        # Auto-detect file type if not provided
        if 'file_type' not in validated_data or not validated_data['file_type']:
            file = validated_data['file']
            if file.content_type.startswith('image/'):
                validated_data['file_type'] = 'image'
            elif file.content_type.startswith('video/'):
                validated_data['file_type'] = 'video'
            elif file.content_type.startswith('audio/'):
                validated_data['file_type'] = 'audio'
            elif file.content_type in ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
                validated_data['file_type'] = 'document'
            else:
                validated_data['file_type'] = 'other'
        
        # Set file metadata
        validated_data['file_name'] = validated_data['file'].name
        validated_data['file_size'] = validated_data['file'].size
        validated_data['mime_type'] = validated_data['file'].content_type
        
        return super().create(validated_data)


class SearchSerializer(serializers.Serializer):
    """
    Serializer for search results.
    """
    query = serializers.CharField(max_length=255)
    conversations = ConversationSerializer(many=True, read_only=True)
    messages = MessageSerializer(many=True, read_only=True)
    groups = GroupSerializer(many=True, read_only=True)
    users = UserSerializer(many=True, read_only=True)