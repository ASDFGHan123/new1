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
            now = timezone.now()
            period = timedelta(days=30)
            current_start = now - period
            previous_start = now - (period * 2)
            previous_end = current_start

            def pct_change(current: int, previous: int) -> float:
                if previous <= 0:
                    return 100.0 if current > 0 else 0.0
                return ((current - previous) / previous) * 100.0

            # User statistics
            total_users = User.objects.count()
            active_users = User.objects.filter(status='active').count()
            online_users = User.objects.filter(online_status='online').count()

            users_created_current = User.objects.filter(created_at__gte=current_start, created_at__lte=now).count()
            users_created_previous = User.objects.filter(created_at__gte=previous_start, created_at__lt=previous_end).count()
            user_growth = pct_change(users_created_current, users_created_previous)
            
            # Message statistics
            total_messages = Message.objects.filter(is_deleted=False).count()

            messages_current = Message.objects.filter(is_deleted=False, timestamp__gte=current_start, timestamp__lte=now).count()
            messages_previous = Message.objects.filter(is_deleted=False, timestamp__gte=previous_start, timestamp__lt=previous_end).count()
            message_growth = pct_change(messages_current, messages_previous)
            
            # Conversation statistics
            total_conversations = Conversation.objects.filter(is_deleted=False).count()
            active_conversations = Conversation.objects.filter(
                is_deleted=False,
                conversation_status='active'
            ).count()

            conversations_current = Conversation.objects.filter(is_deleted=False, created_at__gte=current_start, created_at__lte=now).count()
            conversations_previous = Conversation.objects.filter(is_deleted=False, created_at__gte=previous_start, created_at__lt=previous_end).count()
            conversation_growth = pct_change(conversations_current, conversations_previous)

            # Online users growth (compare to same time yesterday)
            online_window = timedelta(minutes=5)
            online_current = User.objects.filter(last_seen__gte=now - online_window).count()
            yesterday = now - timedelta(days=1)
            online_previous = User.objects.filter(last_seen__gte=yesterday - online_window, last_seen__lt=yesterday).count()
            online_growth = pct_change(online_current, online_previous)
            
            # Calculate percentage of total messages sent today
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
                    'change': round(user_growth, 1),
                    'online_change': round(online_growth, 1),
                },
                'messages': {
                    'total': total_messages,
                    'change': round(message_growth, 1),
                    'today_ratio': round(message_change, 1),
                },
                'conversations': {
                    'total': total_conversations,
                    'active': active_conversations,
                    'change': round(conversation_growth, 1),
                },
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Failed to retrieve dashboard statistics', 'detail': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
