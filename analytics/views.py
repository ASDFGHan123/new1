
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.models import UserActivity, IPAddress, SuspiciousActivity
from django.db.models import Count, Q
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Get dashboard statistics"""
    try:
        users = User.objects.all()
        total_users = users.count()
        active_users = users.filter(status='active').count()
        online_users = users.filter(online_status='online').count()
        
        # Calculate message stats
        total_messages = sum(user.message_count or 0 for user in users)
        messages_today = total_messages // 30  # Estimate daily messages
        
        # Calculate growth percentages (mock for now)
        user_growth = 15.2
        conversation_growth = 8.5
        message_growth = 23.1
        online_growth = -2.4
        
        return Response({
            'totalUsers': total_users,
            'activeUsers': active_users,
            'onlineUsers': online_users,
            'totalMessages': total_messages,
            'messagesToday': messages_today,
            'activeConversations': active_users // 2,  # Estimate
            'userGrowth': user_growth,
            'conversationGrowth': conversation_growth,
            'messageGrowth': message_growth,
            'onlineGrowth': online_growth
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_data(request):
    """Get comprehensive analytics data"""
    try:
        users = User.objects.all()
        
        # User statistics
        user_stats = {
            'total': users.count(),
            'active': users.filter(status='active').count(),
            'pending': users.filter(status='pending').count(),
            'suspended': users.filter(status='suspended').count(),
            'banned': users.filter(status='banned').count()
        }
        
        # Activity statistics
        total_messages = sum(user.message_count or 0 for user in users)
        activity_stats = {
            'totalMessages': total_messages,
            'averageMessages': total_messages // max(users.count(), 1),
            'totalReports': sum(user.report_count or 0 for user in users),
            'totalActivities': UserActivity.objects.count()
        }
        
        # Online statistics
        online_stats = {
            'online': users.filter(online_status='online').count(),
            'away': users.filter(online_status='away').count(),
            'offline': users.filter(online_status='offline').count()
        }
        
        # Security statistics
        security_stats = {
            'totalIPs': IPAddress.objects.count(),
            'threatIPs': IPAddress.objects.filter(is_threat=True).count(),
            'suspiciousActivities': SuspiciousActivity.objects.count(),
            'unresolvedThreats': SuspiciousActivity.objects.filter(is_resolved=False).count()
        }
        
        # Chart data for frontend
        message_data = [
            {"time": "00:00", "messages": 45},
            {"time": "04:00", "messages": 12},
            {"time": "08:00", "messages": 89},
            {"time": "12:00", "messages": 156},
            {"time": "16:00", "messages": 203},
            {"time": "20:00", "messages": 178}
        ]
        
        message_type_data = [
            {"type": "Text", "count": total_messages * 0.7, "color": "#3b82f6"},
            {"type": "Image", "count": total_messages * 0.2, "color": "#10b981"},
            {"type": "File", "count": total_messages * 0.08, "color": "#f59e0b"},
            {"type": "Voice", "count": total_messages * 0.02, "color": "#ef4444"}
        ]
        
        daily_stats = [
            {"day": "Mon", "sent": 245, "delivered": 240, "read": 220},
            {"day": "Tue", "sent": 189, "delivered": 185, "read": 170},
            {"day": "Wed", "sent": 298, "delivered": 295, "read": 280},
            {"day": "Thu", "sent": 267, "delivered": 260, "read": 245},
            {"day": "Fri", "sent": 334, "delivered": 330, "read": 315},
            {"day": "Sat", "sent": 156, "delivered": 150, "read": 140},
            {"day": "Sun", "sent": 123, "delivered": 120, "read": 110}
        ]
        
        return Response({
            'userStats': user_stats,
            'activityStats': activity_stats,
            'onlineStats': online_stats,
            'securityStats': security_stats,
            'messageData': message_data,
            'messageTypeData': message_type_data,
            'dailyStats': daily_stats
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_logs(request):
    """Get audit logs (user activities)"""
    try:
        activities = UserActivity.objects.select_related('user').order_by('-timestamp')[:100]
        
        logs = []
        for activity in activities:
            logs.append({
                'id': activity.id,
                'user': activity.user.username if activity.user else 'System',
                'action': activity.action,
                'description': activity.description,
                'timestamp': activity.timestamp.isoformat(),
                'ip_address': activity.ip_address
            })
        
        return Response({
            'logs': logs,
            'total': UserActivity.objects.count()
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)
