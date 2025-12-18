#!/usr/bin/env python
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserActivity, IPAddress, SuspiciousActivity
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

# Create analytics views content
analytics_views_content = '''
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
        
        return Response({
            'userStats': user_stats,
            'activityStats': activity_stats,
            'onlineStats': online_stats,
            'securityStats': security_stats
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
'''

# Write the analytics views file
analytics_views_path = 'analytics/views.py'
os.makedirs('analytics', exist_ok=True)

with open(analytics_views_path, 'w') as f:
    f.write(analytics_views_content)

print(f"Created {analytics_views_path}")

# Create analytics URLs
analytics_urls_content = '''
from django.urls import path
from . import views

urlpatterns = [
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('data/', views.analytics_data, name='analytics_data'),
    path('audit-logs/', views.audit_logs, name='audit_logs'),
]
'''

with open('analytics/urls.py', 'w') as f:
    f.write(analytics_urls_content)

print("Created analytics/urls.py")

# Create analytics __init__.py
with open('analytics/__init__.py', 'w') as f:
    f.write('')

print("Created analytics/__init__.py")

print("Analytics endpoints created successfully!")
print("Available endpoints:")
print("- GET /api/analytics/dashboard/stats/")
print("- GET /api/analytics/data/")
print("- GET /api/analytics/audit-logs/")