"""
Simple endpoint to refresh user online status.
"""
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from users.services.online_status_service import update_user_online_status

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_user_status_view(request):
    """Refresh current user's online status."""
    try:
        user = request.user
        update_user_online_status(user.id, 'online')
        
        return Response({
            'message': 'Status refreshed',
            'user_id': user.id,
            'online_status': 'online',
            'last_seen': user.last_seen.isoformat() if user.last_seen else None,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error refreshing status: {str(e)}")
        return Response(
            {'error': 'Failed to refresh status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
