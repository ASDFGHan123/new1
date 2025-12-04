"""
Serializers for analytics app.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MessageAnalytics, UserEngagement, ConversationStats

User = get_user_model()


class MessageAnalyticsSerializer(serializers.ModelSerializer):
    """
    Serializer for MessageAnalytics model.
    """
    
    class Meta:
        model = MessageAnalytics
        fields = [
            'id', 'date', 'total_messages', 'individual_messages',
            'group_messages', 'media_messages', 'text_messages',
            'unique_senders', 'peak_hour', 'avg_message_length'
        ]
        read_only_fields = ['id', 'date']


class UserEngagementSerializer(serializers.ModelSerializer):
    """
    Serializer for UserEngagement model.
    """
    user = serializers.StringRelatedField()
    
    class Meta:
        model = UserEngagement
        fields = [
            'id', 'user', 'date', 'messages_sent', 'conversations_joined',
            'groups_joined', 'files_uploaded', 'online_time_minutes'
        ]
        read_only_fields = ['id', 'date']


class ConversationStatsSerializer(serializers.ModelSerializer):
    """
    Serializer for ConversationStats model.
    """
    
    class Meta:
        model = ConversationStats
        fields = [
            'id', 'conversation_type', 'date', 'total_conversations',
            'active_conversations', 'new_conversations', 'avg_participants',
            'most_active_hour'
        ]
        read_only_fields = ['id', 'date']