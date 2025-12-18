"""
Moderation views for handling suspicious activities and user moderation.
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.utils import timezone

from users.models import SuspiciousActivity, User
from admin_panel.models import AuditLog

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def suspicious_activities_list(request):
    """Get list of suspicious activities."""
    try:
        activities = SuspiciousActivity.objects.all().order_by('-timestamp')[:100]
        data = [{
            'id': str(activity.id),
            'ip_address': activity.ip_address,
            'user': {
                'id': str(activity.user.id),
                'username': activity.user.username
            } if activity.user else None,
            'activity_type': activity.activity_type,
            'description': activity.description,
            'severity': activity.severity,
            'is_resolved': activity.is_resolved,
            'timestamp': activity.timestamp.isoformat(),
        } for activity in activities]
        
        return Response({
            'count': len(data),
            'results': data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        logger.error(f"Error fetching suspicious activities: {str(e)}")
        return Response(
            {'error': 'Failed to fetch suspicious activities'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def resolve_suspicious_activity(request, activity_id):
    """Mark suspicious activity as resolved."""
    try:
        activity = SuspiciousActivity.objects.get(id=activity_id)
        activity.is_resolved = True
        activity.save()
        
        AuditLog.log_action(
            action_type=AuditLog.ActionType.SUSPICIOUS_ACTIVITY,
            description=f"Marked suspicious activity as resolved: {activity.activity_type}",
            actor=request.user,
            target_type=AuditLog.TargetType.SYSTEM,
            severity=AuditLog.SeverityLevel.INFO
        )
        
        return Response(
            {'message': 'Activity marked as resolved'},
            status=status.HTTP_200_OK
        )
    except SuspiciousActivity.DoesNotExist:
        return Response(
            {'error': 'Activity not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error resolving activity: {str(e)}")
        return Response(
            {'error': 'Failed to resolve activity'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def warn_user(request, user_id):
    """Send warning to user."""
    try:
        user = User.objects.get(id=user_id)
        reason = request.data.get('reason', 'Violation of community guidelines')
        
        AuditLog.log_action(
            action_type=AuditLog.ActionType.USER_SUSPENDED,
            description=f"Warning issued to user {user.username}: {reason}",
            actor=request.user,
            target_type=AuditLog.TargetType.USER,
            target_id=str(user.id),
            severity=AuditLog.SeverityLevel.WARNING
        )
        
        return Response(
            {'message': f'Warning sent to {user.username}'},
            status=status.HTTP_200_OK
        )
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error warning user: {str(e)}")
        return Response(
            {'error': 'Failed to warn user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def suspend_user_view(request, user_id):
    """Suspend user for specified duration."""
    try:
        user = User.objects.get(id=user_id)
        duration = request.data.get('duration', '1d')
        reason = request.data.get('reason', 'Violation of community guidelines')
        
        user.suspend_user()
        
        AuditLog.log_action(
            action_type=AuditLog.ActionType.USER_SUSPENDED,
            description=f"User {user.username} suspended for {duration}: {reason}",
            actor=request.user,
            target_type=AuditLog.TargetType.USER,
            target_id=str(user.id),
            severity=AuditLog.SeverityLevel.WARNING,
            metadata={'duration': duration, 'reason': reason}
        )
        
        return Response(
            {'message': f'User {user.username} suspended for {duration}'},
            status=status.HTTP_200_OK
        )
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error suspending user: {str(e)}")
        return Response(
            {'error': 'Failed to suspend user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def ban_user_view(request, user_id):
    """Ban user permanently."""
    try:
        user = User.objects.get(id=user_id)
        reason = request.data.get('reason', 'Violation of community guidelines')
        
        user.ban_user()
        
        AuditLog.log_action(
            action_type=AuditLog.ActionType.USER_BANNED,
            description=f"User {user.username} banned: {reason}",
            actor=request.user,
            target_type=AuditLog.TargetType.USER,
            target_id=str(user.id),
            severity=AuditLog.SeverityLevel.CRITICAL,
            metadata={'reason': reason}
        )
        
        return Response(
            {'message': f'User {user.username} has been banned'},
            status=status.HTTP_200_OK
        )
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error banning user: {str(e)}")
        return Response(
            {'error': 'Failed to ban user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
