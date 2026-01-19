"""
Serializers for users app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserSession, UserActivity

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    full_name = serializers.ReadOnlyField()
    is_approved = serializers.ReadOnlyField()
    is_online = serializers.ReadOnlyField()
    display_status = serializers.SerializerMethodField()
    
    def get_display_status(self, obj):
        """Return display status based on is_active and status fields."""
        if not obj.is_active:
            return 'inactive'
        return obj.status
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'avatar', 'bio', 'role', 'status', 'display_status', 'is_active', 'online_status', 'last_seen',
            'join_date', 'message_count', 'report_count', 'email_verified',
            'is_approved', 'is_online', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'message_count', 'report_count',
            'is_approved', 'is_online', 'display_status', 'created_at', 'updated_at'
        ]


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for User list view (reduced fields).
    """
    full_name = serializers.ReadOnlyField()
    join_date = serializers.SerializerMethodField()
    display_status = serializers.SerializerMethodField()
    
    def get_join_date(self, obj):
        return obj.join_date or obj.created_at
    
    def get_display_status(self, obj):
        """Return display status based on is_active and status fields."""
        if not obj.is_active:
            return 'inactive'
        return obj.status
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'avatar', 'role', 'status', 'display_status', 'is_active', 'online_status', 'last_seen', 'join_date',
            'message_count', 'email_verified', 'created_at'
        ]
        read_only_fields = [
            'id', 'message_count', 'email_verified', 'display_status', 'created_at'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating users.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'father_name', 'position',
            'phone_number', 'id_card_number', 'national_id_card_number',
            'description', 'bio', 'role', 'status'
        ]
    
    def validate(self, attrs):
        password_confirm = attrs.get('password_confirm')
        if password_confirm and attrs['password'] != password_confirm:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm', None)
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    """
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False, min_length=8)
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'bio', 'current_password', 'new_password']
    
    def validate(self, attrs):
        current_password = attrs.get('current_password')
        new_password = attrs.get('new_password')
        
        # If new_password is provided, current_password must be provided
        if new_password and not current_password:
            raise serializers.ValidationError("Current password is required to set a new password.")
        
        # If current_password is provided, verify it
        if current_password:
            user = self.instance
            if not user.check_password(current_password):
                raise serializers.ValidationError("Current password is incorrect.")
        
        return attrs
    
    def validate_bio(self, value):
        if len(value) > 500:
            raise serializers.ValidationError("Bio cannot exceed 500 characters.")
        return value
    
    def update(self, instance, validated_data):
        # Remove password fields from validated_data
        new_password = validated_data.pop('new_password', None)
        validated_data.pop('current_password', None)
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Update password if provided
        if new_password:
            instance.set_password(new_password)
        
        instance.save()
        return instance


class UserSessionSerializer(serializers.ModelSerializer):
    """
    Serializer for UserSession model.
    """
    user = UserSerializer(read_only=True)
    is_expired = serializers.ReadOnlyField()
    
    class Meta:
        model = UserSession
        fields = [
            'id', 'user', 'session_key', 'ip_address', 'user_agent',
            'is_active', 'created_at', 'last_activity', 'expires_at', 'is_expired'
        ]
        read_only_fields = [
            'id', 'session_key', 'created_at', 'last_activity', 'is_expired'
        ]


class UserActivitySerializer(serializers.ModelSerializer):
    """
    Serializer for UserActivity model.
    """
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = UserActivity
        fields = [
            'id', 'user', 'action', 'description', 'ip_address',
            'user_agent', 'timestamp'
        ]
        read_only_fields = [
            'id', 'timestamp'
        ]


class UserStatisticsSerializer(serializers.Serializer):
    """
    Serializer for user statistics.
    """
    total_messages = serializers.IntegerField()
    total_conversations = serializers.IntegerField()
    total_groups = serializers.IntegerField()
    member_since = serializers.DateTimeField()
    last_activity = serializers.DateTimeField()
    online_status = serializers.CharField()
    daily_message_average = serializers.FloatField()
    weekly_activity = serializers.DictField()
    monthly_activity = serializers.DictField()
