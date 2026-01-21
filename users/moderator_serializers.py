"""
Serializers for moderator models.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.moderator_models import (
    ModeratorProfile, ModerationAction, ModeratorRole, ModeratorPermission
)

User = get_user_model()


class ModeratorPermissionSerializer(serializers.ModelSerializer):
    """Serializer for ModeratorPermission."""
    
    class Meta:
        model = ModeratorPermission
        fields = ['id', 'permission', 'description']
        read_only_fields = ['id']


class ModeratorRoleSerializer(serializers.ModelSerializer):
    """Serializer for ModeratorRole."""
    permissions = ModeratorPermissionSerializer(many=True, read_only=True)
    
    class Meta:
        model = ModeratorRole
        fields = ['id', 'name', 'role_type', 'description', 'permissions', 'is_active']
        read_only_fields = ['id']


class ModeratorProfileSerializer(serializers.ModelSerializer):
    """Serializer for ModeratorProfile."""
    user = serializers.StringRelatedField(read_only=True)
    role = ModeratorRoleSerializer(read_only=True)
    permissions = serializers.SerializerMethodField()
    
    def get_permissions(self, obj):
        """Get list of permission codes."""
        return obj.get_permissions()
    
    class Meta:
        model = ModeratorProfile
        fields = [
            'id', 'user', 'role', 'permissions',
            'warnings_issued', 'suspensions_issued', 'bans_issued',
            'messages_deleted', 'last_moderation_action',
            'is_active_moderator', 'assigned_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'warnings_issued', 'suspensions_issued', 'bans_issued',
            'messages_deleted', 'last_moderation_action', 'assigned_at', 'updated_at'
        ]


class ModerationActionSerializer(serializers.ModelSerializer):
    """Serializer for ModerationAction."""
    moderator = serializers.StringRelatedField(read_only=True)
    target_user = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = ModerationAction
        fields = [
            'id', 'moderator', 'action_type', 'target_user', 'target_id',
            'target_type', 'reason', 'duration', 'is_active',
            'appeal_status', 'created_at', 'expires_at'
        ]
        read_only_fields = [
            'id', 'moderator', 'created_at'
        ]


class ModeratorStatsSerializer(serializers.Serializer):
    """Serializer for moderator statistics."""
    total_warnings = serializers.IntegerField()
    total_suspensions = serializers.IntegerField()
    total_bans = serializers.IntegerField()
    total_messages_deleted = serializers.IntegerField()
    active_actions = serializers.IntegerField()
    last_action_date = serializers.DateTimeField()
    actions_this_week = serializers.IntegerField()
    actions_this_month = serializers.IntegerField()
