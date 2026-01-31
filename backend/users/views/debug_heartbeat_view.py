"""
Debug endpoint to check user heartbeat activity.
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from users.models import User

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def debug_user_heartbeat_view(request, username):
    """Debug: Check if user is sending heartbeats."""
    try:
        user = User.objects.get(username=username)
        now = timezone.now()
        
        # Calculate time since last_seen
        time_since_last_seen = (now - user.last_seen).total_seconds() if user.last_seen else None
        
        return Response({
            'username': user.username,
            'online_status': user.online_status,
            'last_seen': user.last_seen.isoformat() if user.last_seen else None,
            'time_since_last_seen_seconds': time_since_last_seen,
            'is_sending_heartbeats': time_since_last_seen < 60 if time_since_last_seen else False,
            'will_go_offline_in_seconds': max(0, 120 - time_since_last_seen) if time_since_last_seen else 120,
            'debug_info': {
                'current_time': now.isoformat(),
                'last_seen': user.last_seen.isoformat() if user.last_seen else None,
                'status': user.status,
                'is_active': user.is_active,
            }
        }, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': f'User {username} not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error checking heartbeat: {str(e)}")
        return Response(
            {'error': 'Failed to check heartbeat'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
