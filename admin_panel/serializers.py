"""
Serializers for admin_panel app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models import User, UserActivity
from chat.models import Message, Conversation, Group
from .models import AuditLog, Trash, Backup, SystemSettings, MessageTemplate, AdminOutgoingMessage

User = get_user_model()


class AuditLogSerializer(serializers.ModelSerializer):
    """
    Serializer for AuditLog model.
    """
    actor = serializers.SerializerMethodField()
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'actor', 'action_type', 'description', 'target_type', 'target_id',
            'severity', 'category', 'ip_address', 'user_agent', 'session_id', 'timestamp', 'metadata'
        ]
        read_only_fields = ['id', 'timestamp']
    
    def get_actor(self, obj):
        if obj.actor:
            return obj.actor.username
        return 'System'


class AuditLogCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating audit logs.
    """
    
    class Meta:
        model = AuditLog
        fields = ['action_type', 'description', 'target_type', 'target_id', 'severity', 'category', 'metadata']
    
    def create(self, validated_data):
        validated_data['actor'] = self.context['request'].user
        validated_data['ip_address'] = self.get_client_ip(self.context['request'])
        validated_data['user_agent'] = self.context['request'].META.get('HTTP_USER_AGENT', '')
        return super().create(validated_data)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class TrashSerializer(serializers.ModelSerializer):
    """
    Serializer for Trash model.
    """
    deleted_by = serializers.StringRelatedField()
    source_tab_display = serializers.CharField(source='get_source_tab_display', read_only=True)
    is_restorable = serializers.SerializerMethodField()
    restore_unavailable_reason = serializers.SerializerMethodField()
    
    class Meta:
        model = Trash
        fields = [
            'id', 'item_type', 'item_id', 'item_data', 'deleted_by',
            'delete_reason', 'deleted_at', 'source_tab', 'source_tab_display',
            'is_restorable', 'restore_unavailable_reason'
        ]
        read_only_fields = ['id', 'deleted_at', 'source_tab_display']

    def get_is_restorable(self, obj):
        if obj.item_type == Trash.ItemType.USER:
            return User.objects.filter(id=obj.item_id).exists()
        if obj.item_type == Trash.ItemType.CONVERSATION:
            return Conversation.objects.filter(id=obj.item_id).exists()
        if obj.item_type == Trash.ItemType.MESSAGE:
            return Message.objects.filter(id=obj.item_id).exists()
        if obj.item_type == Trash.ItemType.DEPARTMENT:
            name = (obj.item_data or {}).get('name')
            if not name:
                return False
            # Restorable if it doesn't already exist by name
            from users.models_organization import Department
            return not Department.objects.filter(name=name).exists()
        if obj.item_type == Trash.ItemType.OFFICE:
            data = obj.item_data or {}
            name = data.get('name')
            department_id = data.get('department_id')
            if not name or not department_id:
                return False
            from users.models_organization import Department, Office
            department = Department.objects.filter(id=department_id).first()
            if not department:
                return False
            return not Office.objects.filter(department=department, name=name).exists()
        return False

    def get_restore_unavailable_reason(self, obj):
        if obj.item_type in [Trash.ItemType.USER, Trash.ItemType.CONVERSATION, Trash.ItemType.MESSAGE]:
            if not self.get_is_restorable(obj):
                return f'Could not restore {obj.item_type} item - original item not found'
            return ''
        if obj.item_type == Trash.ItemType.DEPARTMENT:
            if not self.get_is_restorable(obj):
                name = (obj.item_data or {}).get('name')
                if not name:
                    return 'Could not restore DEPARTMENT - missing name'
                return f'Could not restore DEPARTMENT - a department named "{name}" already exists'
            return ''
        if obj.item_type == Trash.ItemType.OFFICE:
            if not self.get_is_restorable(obj):
                data = obj.item_data or {}
                name = data.get('name')
                department_id = data.get('department_id')
                if not name or not department_id:
                    return 'Could not restore OFFICE - missing name or department_id'
                from users.models_organization import Department
                if not Department.objects.filter(id=department_id).exists():
                    return 'Could not restore OFFICE - department not found. Restore the department first.'
                return f'Could not restore OFFICE - an office named "{name}" already exists in this department'
            return ''
        return 'This item type cannot be restored'


class BackupSerializer(serializers.ModelSerializer):
    """
    Serializer for Backup model.
    """
    created_by = serializers.StringRelatedField()
    size_mb = serializers.SerializerMethodField()
    
    class Meta:
        model = Backup
        fields = [
            'id', 'name', 'description', 'backup_type', 'file',
            'file_size', 'size_mb', 'status', 'progress', 'record_count',
            'created_by', 'created_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'file_size', 'size_mb', 'progress', 'record_count', 'created_at', 'completed_at'
        ]
    
    def get_size_mb(self, obj):
        if obj.file_size:
            return round(obj.file_size / (1024 * 1024), 2)
        return None


class BackupCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating backups.
    """
    
    class Meta:
        model = Backup
        fields = ['name', 'description', 'backup_type']
    
    def create(self, validated_data):
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MessageTemplate
        fields = [
            'id', 'name', 'content', 'category', 'usage_count',
            'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_by', 'created_at', 'updated_at']


class AdminOutgoingMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminOutgoingMessage
        fields = [
            'id', 'type', 'content', 'recipients', 'recipient_count',
            'sent_by', 'sent_at', 'status', 'priority'
        ]
        read_only_fields = ['id', 'sent_by', 'sent_at']


class SystemSettingSerializer(serializers.ModelSerializer):
    """
    Serializer for SystemSettings model.
    """
    updated_by = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = SystemSettings
        fields = [
            'id', 'key', 'value', 'category', 'description',
            'is_public', 'updated_by', 'updated_at'
        ]
        read_only_fields = [
            'id', 'updated_by', 'updated_at'
        ]


class SystemSettingCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating system settings.
    """
    
    class Meta:
        model = SystemSettings
        fields = ['key', 'value', 'category', 'description', 'is_public']
    
    def validate_key(self, value):
        # Ensure key is unique
        if SystemSettings.objects.filter(key=value).exclude(pk=self.instance.pk if self.instance else None).exists():
            raise serializers.ValidationError("Setting with this key already exists.")
        return value
    
    def create(self, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        validated_data['updated_by'] = self.context['request'].user
        return super().update(instance, validated_data)


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics.
    """
    # User stats
    total_users = serializers.IntegerField()
    active_users = serializers.IntegerField()
    pending_users = serializers.IntegerField()
    suspended_users = serializers.IntegerField()
    
    # Chat stats
    total_conversations = serializers.IntegerField()
    active_conversations = serializers.IntegerField()
    total_messages = serializers.IntegerField()
    total_groups = serializers.IntegerField()
    
    # System stats
    system_uptime = serializers.CharField()
    database_size = serializers.CharField()
    disk_usage = serializers.CharField()
    
    # Recent activity
    recent_registrations = serializers.IntegerField()
    recent_messages = serializers.IntegerField()
    online_users = serializers.IntegerField()
    
    # Activity data for charts
    user_registration_trend = serializers.ListField()
    message_activity_trend = serializers.ListField()
    popular_groups = serializers.ListField()
    
    # Performance metrics
    avg_response_time = serializers.FloatField()
    error_rate = serializers.FloatField()
    uptime_percentage = serializers.FloatField()


class SystemMonitoringSerializer(serializers.Serializer):
    """
    Serializer for system monitoring data.
    """
    cpu_usage = serializers.FloatField()
    memory_usage = serializers.FloatField()
    disk_usage = serializers.FloatField()
    network_io = serializers.DictField()
    database_connections = serializers.IntegerField()
    active_sessions = serializers.IntegerField()
    cache_hit_rate = serializers.FloatField()
    
    # Recent alerts
    recent_alerts = serializers.ListField()
    
    # Performance graphs
    cpu_history = serializers.ListField()
    memory_history = serializers.ListField()
    response_time_history = serializers.ListField()
