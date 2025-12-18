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
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'avatar', 'bio', 'role', 'status', 'online_status', 'last_seen',
            'join_date', 'message_count', 'report_count', 'email_verified',
            'is_approved', 'is_online', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'message_count', 'report_count',
            'is_approved', 'is_online', 'created_at', 'updated_at'
        ]


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for User list view (reduced fields).
    """
    full_name = serializers.ReadOnlyField()
    join_date = serializers.SerializerMethodField()
    
    def get_join_date(self, obj):
        return obj.join_date or obj.created_at
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'avatar', 'role', 'status', 'online_status', 'last_seen', 'join_date',
            'message_count', 'email_verified', 'created_at'
        ]
        read_only_fields = [
            'id', 'message_count', 'email_verified', 'created_at'
        ]


class UserCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating users.
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name', 'bio'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match.")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating user profile.
    """
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'bio']
    
    def validate_bio(self, value):
        if len(value) > 500:
            raise serializers.ValidationError("Bio cannot exceed 500 characters.")
        return value


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