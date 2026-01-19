"""
Simple endpoint to get all users with fresh online status.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from users.models import User
import logging

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users_with_status(request):
    """
    Get all users with their current online status.
    Returns fresh data directly from database.
    """
    try:
        from users.models import User
        users = User.objects.all().values(
            'id', 'username', 'email', 'first_name', 'last_name',
            'online_status', 'last_seen', 'role', 'status', 'is_active', 'created_at'
        ).order_by('-created_at')
        
        users_list = []
        for user in users:
            # If account is inactive or not active, force offline
            if not user['is_active'] or user['status'] in ['inactive', 'suspended', 'banned']:
                user['online_status'] = 'offline'
            users_list.append(user)
        
        logger.info(f"Returning {len(users_list)} users with fresh status")
        
        return Response({
            'users': users_list,
            'count': len(users_list)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve users'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
