from rest_framework import serializers
from .models import FlaggedMessage, UserModeration, ContentReview
from django.contrib.auth import get_user_model

User = get_user_model()


class FlaggedMessageSerializer(serializers.ModelSerializer):
    reported_by_username = serializers.CharField(source='reported_by.username', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = FlaggedMessage
        fields = [
            'id', 'message_id', 'message_content', 'sender_id', 'sender_username',
            'reason', 'description', 'status', 'reported_by', 'reported_by_username',
            'reviewed_by', 'reviewed_by_username', 'review_notes', 'reported_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'reported_at', 'reviewed_at', 'reviewed_by', 'review_notes']


class UserModerationSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    moderator_username = serializers.CharField(source='moderator.username', read_only=True, allow_null=True)
    
    class Meta:
        model = UserModeration
        fields = [
            'id', 'user', 'user_username', 'action_type', 'reason', 'status',
            'duration_days', 'moderator', 'moderator_username', 'created_at',
            'expires_at', 'lifted_at'
        ]
        read_only_fields = ['id', 'created_at', 'expires_at', 'lifted_at']


class ContentReviewSerializer(serializers.ModelSerializer):
    submitted_by_username = serializers.CharField(source='submitted_by.username', read_only=True, allow_null=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, allow_null=True)
    
    class Meta:
        model = ContentReview
        fields = [
            'id', 'content_type', 'content_id', 'content_data', 'status', 'priority',
            'submitted_by', 'submitted_by_username', 'reviewed_by', 'reviewed_by_username',
            'review_notes', 'created_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'created_at', 'reviewed_at']
