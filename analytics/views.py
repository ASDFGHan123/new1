"""
Analytics views for OffChat application.
Provides comprehensive analytics and reporting functionality.
"""
from django.db.models import Count, Q, Avg, Sum, Max, Min
from django.db.models.functions import TruncDay, TruncHour, TruncWeek, TruncMonth
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from django.views.generic import View
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework import status
from datetime import datetime, timedelta
import csv
import json
from uuid import UUID

from users.models import User, UserActivity
from chat.models import Conversation, Message, Group


class GeneralAnalyticsView(APIView):
    """General analytics view for admin dashboard."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get general analytics data for admin dashboard."""
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        # Basic system stats
        total_users = User.objects.count()
        active_users = User.objects.filter(status='active').count()
        total_messages = Message.objects.count()
        total_conversations = Conversation.objects.count()
        
        # Recent message activity (last 30 days)
        recent_messages = Message.objects.filter(
            timestamp__gte=thirty_days_ago
        )
        messages_last_30_days = recent_messages.count()
        
        # Daily message data for the last 7 days (simulating hourly data)
        daily_message_counts = []
        for i in range(7):
            day_start = now - timedelta(days=i)
            day_messages = Message.objects.filter(
                timestamp__gte=day_start - timedelta(days=1),
                timestamp__lt=day_start
            ).count()
            daily_message_counts.append({
                'time': day_start.strftime('%H:%M'),
                'messages': day_messages
            })
        
        # Message type breakdown (using available data)
        text_messages = Message.objects.filter(message_type='text').count()
        image_messages = Message.objects.filter(message_type='image').count()
        file_messages = Message.objects.filter(message_type='file').count()
        voice_messages = Message.objects.filter(message_type='voice').count()
        
        message_type_data = [
            {'type': 'Text', 'count': text_messages, 'color': '#3b82f6'},
            {'type': 'Image', 'count': image_messages, 'color': '#10b981'},
            {'type': 'File', 'count': file_messages, 'color': '#f59e0b'},
            {'type': 'Voice', 'count': voice_messages, 'color': '#ef4444'},
        ]
        
        # Daily stats for last 7 days
        daily_stats = []
        for i in range(7):
            day_start = now - timedelta(days=i)
            day_end = day_start + timedelta(days=1)
            day_messages = Message.objects.filter(
                timestamp__gte=day_start,
                timestamp__lt=day_end
            ).count()
            
            daily_stats.append({
                'day': day_start.strftime('%a'),
                'sent': day_messages,
                'delivered': int(day_messages * 0.98),  # Simulating 98% delivery rate
                'read': int(day_messages * 0.94),  # Simulating 94% read rate
            })
        
        # Calculate averages
        total_7_days = sum(stat['sent'] for stat in daily_stats)
        average_messages = total_7_days // 7 if daily_stats else 0
        
        analytics_data = {
            'messageData': daily_message_counts,
            'messageTypeData': message_type_data,
            'dailyStats': daily_stats,
            'totalMessages': total_messages,
            'messagesToday': daily_message_counts[0]['messages'] if daily_message_counts else 0,
            'activeUsers': active_users,
            'averageMessages': average_messages,
        }
        
        return Response(analytics_data)


class UserAnalyticsView(APIView):
    """Analytics view for individual user metrics."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """Get analytics for a specific user."""
        try:
            user = User.objects.get(id=user_id)
            
            # Ensure user can only view their own analytics or is admin
            if request.user != user and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Basic user stats
            user_stats = {
                'user_id': str(user.id),
                'username': user.username,
                'join_date': user.join_date,
                'status': user.status,
                'message_count': user.message_count,
                'report_count': user.report_count,
                'last_seen': user.last_seen,
                'online_status': user.online_status,
            }
            
            # Recent activity (last 30 days)
            thirty_days_ago = timezone.now() - timedelta(days=30)
            recent_activities = UserActivity.objects.filter(
                user=user,
                timestamp__gte=thirty_days_ago
            ).values('action').annotate(count=Count('action'))
            
            user_stats['recent_activity'] = list(recent_activities)
            
            # Message statistics
            messages_last_30_days = Message.objects.filter(
                sender=user,
                timestamp__gte=thirty_days_ago
            ).count()
            
            user_stats['messages_last_30_days'] = messages_last_30_days
            
            # Conversation participation
            conversation_count = Conversation.objects.filter(
                participants=user
            ).count()
            
            user_stats['total_conversations'] = conversation_count
            
            return Response(user_stats)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class UserEngagementView(APIView):
    """User engagement analytics."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, user_id):
        """Get engagement metrics for a user."""
        try:
            user = User.objects.get(id=user_id)
            
            if request.user != user and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Daily activity for last 30 days
            daily_activity = UserActivity.objects.filter(
                user=user,
                timestamp__gte=timezone.now() - timedelta(days=30)
            ).extra(
                select={'day': 'date(timestamp)'}
            ).values('day').annotate(
                activity_count=Count('id')
            ).order_by('day')
            
            # Hourly activity pattern
            hourly_activity = UserActivity.objects.filter(
                user=user,
                timestamp__gte=timezone.now() - timedelta(days=7)
            ).extra(
                select={'hour': 'strftime("%H", timestamp)'}
            ).values('hour').annotate(
                activity_count=Count('id')
            ).order_by('hour')
            
            engagement_data = {
                'daily_activity': list(daily_activity),
                'hourly_activity': list(hourly_activity),
                'total_activities_30_days': sum(item['activity_count'] for item in daily_activity),
                'avg_daily_activities': sum(item['activity_count'] for item in daily_activity) / 30 if daily_activity else 0,
            }
            
            return Response(engagement_data)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class ConversationAnalyticsView(APIView):
    """Analytics for conversation metrics."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, conversation_id):
        """Get analytics for a specific conversation."""
        try:
            # Validate UUID
            conv_id = UUID(conversation_id)
            conversation = Conversation.objects.get(id=conv_id)
            
            # Check if user is participant or admin
            if request.user not in conversation.participants.all() and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Basic conversation stats
            total_messages = Message.objects.filter(conversation=conversation).count()
            participants_count = conversation.participants.count()
            created_date = conversation.created_at
            
            # Message activity over time
            message_activity = Message.objects.filter(
                conversation=conversation
            ).extra(
                select={'day': 'date(timestamp)'}
            ).values('day').annotate(
                message_count=Count('id')
            ).order_by('day')[:30]  # Last 30 days
            
            # Most active participants
            active_participants = Message.objects.filter(
                conversation=conversation
            ).values('sender__username').annotate(
                message_count=Count('id')
            ).order_by('-message_count')[:10]
            
            conversation_stats = {
                'conversation_id': str(conversation.id),
                'title': conversation.title,
                'type': conversation.type,
                'total_messages': total_messages,
                'participants_count': participants_count,
                'created_date': created_date,
                'message_activity': list(message_activity),
                'most_active_participants': list(active_participants),
            }
            
            return Response(conversation_stats)
            
        except (Conversation.DoesNotExist, ValueError):
            return Response(
                {'error': 'Conversation not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class SystemAnalyticsView(APIView):
    """System-wide analytics view."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get system-wide analytics."""
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        seven_days_ago = now - timedelta(days=7)
        
        # User statistics
        total_users = User.objects.count()
        active_users = User.objects.filter(status='active').count()
        pending_users = User.objects.filter(status='pending').count()
        new_users_last_30_days = User.objects.filter(
            join_date__gte=thirty_days_ago
        ).count()
        
        # Message statistics
        total_messages = Message.objects.count()
        messages_last_30_days = Message.objects.filter(
            timestamp__gte=thirty_days_ago
        ).count()
        messages_last_7_days = Message.objects.filter(
            timestamp__gte=seven_days_ago
        ).count()
        
        # Conversation statistics
        total_conversations = Conversation.objects.count()
        group_conversations = Conversation.objects.filter(conversation_type='group').count()
        individual_conversations = Conversation.objects.filter(conversation_type='individual').count()
        
        # System metrics
        system_stats = {
            'users': {
                'total': total_users,
                'active': active_users,
                'pending': pending_users,
                'new_last_30_days': new_users_last_30_days,
            },
            'messages': {
                'total': total_messages,
                'last_30_days': messages_last_30_days,
                'last_7_days': messages_last_7_days,
            },
            'conversations': {
                'total': total_conversations,
                'groups': group_conversations,
                'individual': individual_conversations,
            },
            'generated_at': now,
        }
        
        return Response(system_stats)


class SystemOverviewView(APIView):
    """System overview dashboard data."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get system overview for admin dashboard."""
        now = timezone.now()
        
        # Daily user registrations for last 30 days
        daily_registrations = User.objects.filter(
            join_date__gte=now - timedelta(days=30)
        ).extra(
            select={'day': 'date(join_date)'}
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
        
        # Daily message volume for last 30 days
        daily_messages = Message.objects.filter(
            timestamp__gte=now - timedelta(days=30)
        ).extra(
            select={'day': 'date(timestamp)'}
        ).values('day').annotate(
            count=Count('id')
        ).order_by('day')
        
        # Top active users by message count
        top_users = User.objects.filter(
            status='active'
        ).order_by('-message_count')[:10].values(
            'username', 'message_count', 'last_seen'
        )
        
        overview_data = {
            'daily_registrations': list(daily_registrations),
            'daily_messages': list(daily_messages),
            'top_users': list(top_users),
            'generated_at': now,
        }
        
        return Response(overview_data)


class PerformanceMetricsView(APIView):
    """System performance metrics."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Get system performance metrics."""
        now = timezone.now()
        
        # Database query performance
        db_stats = {
            'total_users': User.objects.count(),
            'total_messages': Message.objects.count(),
            'total_conversations': Conversation.objects.count(),
            'total_activities': UserActivity.objects.count(),
        }
        
        # Recent activity volume
        hourly_activity = UserActivity.objects.filter(
            timestamp__gte=now - timedelta(hours=24)
        ).extra(
            select={'hour': 'strftime("%H", timestamp)'}
        ).values('hour').annotate(
            count=Count('id')
        ).order_by('hour')
        
        performance_data = {
            'database_stats': db_stats,
            'hourly_activity_24h': list(hourly_activity),
            'generated_at': now,
        }
        
        return Response(performance_data)


class MessageMetricsView(APIView):
    """Message-specific analytics."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request, message_id):
        """Get metrics for a specific message."""
        try:
            msg_id = UUID(message_id)
            message = Message.objects.get(id=msg_id)
            
            # Check if user has access to this conversation
            if request.user not in message.conversation.participants.all() and not request.user.is_staff:
                return Response(
                    {'error': 'Permission denied'}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Message metrics
            metrics = {
                'message_id': str(message.id),
                'conversation_id': str(message.conversation.id),
                'sender': message.sender.username,
                'created_at': message.timestamp,
                'is_edited': message.is_edited,
                'edit_count': message.edit_count if hasattr(message, 'edit_count') else 0,
                'has_attachments': message.attachments.exists() if hasattr(message, 'attachments') else False,
            }
            
            # Additional context if user is admin
            if request.user.is_staff:
                metrics.update({
                    'ip_address': getattr(message, 'ip_address', None),
                    'user_agent': getattr(message, 'user_agent', None),
                })
            
            return Response(metrics)
            
        except (Message.DoesNotExist, ValueError):
            return Response(
                {'error': 'Message not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )


class UserReportView(APIView):
    """Generate user analytics report."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Generate user report."""
        format_type = request.GET.get('format', 'json')
        
        # Get user statistics
        user_data = User.objects.all().values(
            'id', 'username', 'email', 'status', 'role',
            'join_date', 'last_seen', 'message_count', 'report_count',
            'is_active', 'email_verified'
        )
        
        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="user_report.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'ID', 'Username', 'Email', 'Status', 'Role', 
                'Join Date', 'Last Seen', 'Message Count', 
                'Report Count', 'Active', 'Email Verified'
            ])
            
            for user in user_data:
                writer.writerow([
                    user['id'], user['username'], user['email'],
                    user['status'], user['role'], user['join_date'],
                    user['last_seen'], user['message_count'],
                    user['report_count'], user['is_active'], user['email_verified']
                ])
            
            return response
        
        return Response({'users': list(user_data)})


class ActivityReportView(APIView):
    """Generate activity analytics report."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Generate activity report."""
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        # Activity breakdown by action type
        activity_summary = UserActivity.objects.filter(
            timestamp__gte=start_date
        ).values('action').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Daily activity trends
        daily_trends = UserActivity.objects.filter(
            timestamp__gte=start_date
        ).extra(
            select={'day': 'date(timestamp)'}
        ).values('day').annotate(
            total_activities=Count('id')
        ).order_by('day')
        
        report_data = {
            'period_days': days,
            'activity_summary': list(activity_summary),
            'daily_trends': list(daily_trends),
            'generated_at': timezone.now(),
        }
        
        return Response(report_data)


class EngagementReportView(APIView):
    """Generate engagement analytics report."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Generate engagement report."""
        # User engagement metrics
        engagement_data = User.objects.filter(
            status='active'
        ).annotate(
            message_count_30d=Count(
                'sent_messages__timestamp',
                filter=Q(sent_messages__timestamp__gte=timezone.now() - timedelta(days=30))
            )
        ).values(
            'username', 'message_count', 'message_count_30d', 'last_seen'
        ).order_by('-message_count_30d')[:50]
        
        # Conversation engagement
        conversation_engagement = Conversation.objects.annotate(
            message_count=Count('messages'),
            participant_count=Count('participants')
        ).values(
            'title', 'type', 'message_count', 'participant_count', 'created_at'
        ).order_by('-message_count')[:20]
        
        report_data = {
            'top_engaged_users': list(engagement_data),
            'popular_conversations': list(conversation_engagement),
            'generated_at': timezone.now(),
        }
        
        return Response(report_data)


class ExportUserDataView(APIView):
    """Export user data."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Export comprehensive user data."""
        format_type = request.GET.get('format', 'json')
        
        # Get detailed user data with related information
        users_data = []
        for user in User.objects.all().prefetch_related('activities', 'sessions'):
            user_data = {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'bio': user.bio,
                'role': user.role,
                'status': user.status,
                'join_date': user.join_date,
                'last_seen': user.last_seen,
                'message_count': user.message_count,
                'report_count': user.report_count,
                'is_active': user.is_active,
                'email_verified': user.email_verified,
                'activities_count': user.activities.count(),
                'sessions_count': user.sessions.filter(is_active=True).count(),
            }
            users_data.append(user_data)
        
        if format_type == 'csv':
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="user_data_export.csv"'
            
            writer = csv.writer(response)
            writer.writerow([
                'ID', 'Username', 'Email', 'First Name', 'Last Name',
                'Bio', 'Role', 'Status', 'Join Date', 'Last Seen',
                'Message Count', 'Report Count', 'Active', 'Email Verified',
                'Activities Count', 'Active Sessions'
            ])
            
            for user in users_data:
                writer.writerow([
                    user['id'], user['username'], user['email'],
                    user['first_name'], user['last_name'], user['bio'],
                    user['role'], user['status'], user['join_date'],
                    user['last_seen'], user['message_count'], user['report_count'],
                    user['is_active'], user['email_verified'],
                    user['activities_count'], user['sessions_count']
                ])
            
            return response
        
        return Response({'users': users_data})


class ExportActivityDataView(APIView):
    """Export activity data."""
    
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        """Export user activity data."""
        days = int(request.GET.get('days', 30))
        start_date = timezone.now() - timedelta(days=days)
        
        activities = UserActivity.objects.filter(
            timestamp__gte=start_date
        ).select_related('user').order_by('-timestamp')
        
        activities_data = []
        for activity in activities:
            activities_data.append({
                'id': str(activity.id),
                'user_id': str(activity.user.id),
                'username': activity.user.username,
                'action': activity.action,
                'description': activity.description,
                'timestamp': activity.timestamp,
                'ip_address': activity.ip_address,
            })
        
        return Response({
            'activities': activities_data,
            'period_days': days,
            'total_activities': len(activities_data)
        })


# Legacy view for backward compatibility
def SystemOverviewViewLegacy(request):
    """Legacy system overview view."""
    return JsonResponse({
        'error': 'This view has been moved to the APIView class',
        'status': 'deprecated'
    })
