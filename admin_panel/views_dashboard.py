"""
Dashboard statistics views.
"""
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework import status
from users.models import User
from chat.models import Message, Conversation
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get comprehensive dashboard statistics."""
        try:
            # User statistics
            total_users = User.objects.count()
            active_users = User.objects.filter(status='active').count()
            online_users = User.objects.filter(online_status='online').count()
            
            # Message statistics
            total_messages = Message.objects.filter(is_deleted=False).count()
            
            # Conversation statistics
            total_conversations = Conversation.objects.filter(is_deleted=False).count()
            active_conversations = Conversation.objects.filter(
                is_deleted=False,
                conversation_status='active'
            ).count()
            
            # Calculate percentage of total messages sent today
            now = timezone.now()
            today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            
            messages_today = Message.objects.filter(
                is_deleted=False,
                timestamp__gte=today_start
            ).count()
            
            # Percentage of today's messages relative to total
            if total_messages > 0:
                message_change = (messages_today / total_messages) * 100
            else:
                message_change = 0
            
            return Response({
                'users': {
                    'total': total_users,
                    'active': active_users,
                    'online': online_users,
                },
                'messages': {
                    'total': total_messages,
                    'change': round(message_change, 1),
                },
                'conversations': {
                    'total': total_conversations,
                    'active': active_conversations,
                },
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve dashboard statistics', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
