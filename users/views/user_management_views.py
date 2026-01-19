"""
Comprehensive user management API views.
"""
import logging
import os
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from django.core.exceptions import ValidationError
from django.conf import settings

from users.services.user_management_service import UserManagementService

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_list_view(request):
    """
    Get paginated list of users with filtering options.
    """
    try:
        # Get query parameters
        params = {
            'page': request.GET.get('page', 1),
            'per_page': request.GET.get('per_page', 20),
            'search': request.GET.get('search', ''),
            'status': request.GET.get('status', ''),
            'role': request.GET.get('role', ''),
            'online_status': request.GET.get('online_status', ''),
            'date_from': request.GET.get('date_from', ''),
            'date_to': request.GET.get('date_to', ''),
            'ordering': request.GET.get('ordering', '-created_at'),
        }
        
        result = UserManagementService.get_users_list(params)
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in users list view: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve users list'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def create_user_view(request):
    """
    Create a new user.
    """
    try:
        user_data = request.data
        result = UserManagementService.create_user(user_data)
        return Response(result, status=status.HTTP_201_CREATED)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error creating user: {str(e)}")
        return Response(
            {'error': 'Failed to create user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_detail_view(request, user_id):
    """
    Get detailed user information.
    """
    try:
        result = UserManagementService.get_user_detail(user_id)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting user detail: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user detail'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAdminUser])
def update_user_view(request, user_id):
    """
    Update user information.
    """
    try:
        user_data = request.data
        result = UserManagementService.update_user(user_id, user_data)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error updating user: {str(e)}")
        return Response(
            {'error': 'Failed to update user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def delete_user_view(request, user_id):
    """
    Delete or deactivate a user.
    """
    try:
        permanent = request.query_params.get('permanent', 'false').lower() == 'true'
        result = UserManagementService.delete_user(user_id, permanent=permanent)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error deleting user: {str(e)}")
        return Response(
            {'error': 'Failed to delete user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def approve_user_view(request, user_id):
    """
    Approve a pending user.
    """
    try:
        from users.notification_utils import send_notification
        result = UserManagementService.approve_user(user_id)
        user = result.get('user')
        if user:
            send_notification(
                user=user,
                notification_type='user_approved',
                title='Account Approved',
                message='Your account has been approved! You can now login.',
                data={'user_id': user_id}
            )
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error approving user: {str(e)}")
        return Response(
            {'error': 'Failed to approve user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def suspend_user_view(request, user_id):
    """
    Suspend a user.
    """
    try:
        reason = request.data.get('reason', '')
        result = UserManagementService.suspend_user(user_id, reason=reason)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
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
    """
    Ban a user.
    """
    try:
        reason = request.data.get('reason', '')
        result = UserManagementService.ban_user(user_id, reason=reason)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error banning user: {str(e)}")
        return Response(
            {'error': 'Failed to ban user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def activate_user_view(request, user_id):
    """
    Activate a suspended or banned user.
    """
    try:
        result = UserManagementService.activate_user(user_id)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error activating user: {str(e)}")
        return Response(
            {'error': 'Failed to activate user'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def change_user_role_view(request, user_id):
    """
    Change user role.
    """
    try:
        new_role = request.data.get('role')
        if not new_role:
            return Response(
                {'error': 'Role is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = UserManagementService.change_user_role(user_id, new_role)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error changing user role: {str(e)}")
        return Response(
            {'error': 'Failed to change user role'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
 
 
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def bulk_update_users_view(request):
    """
    Perform bulk operations on multiple users.
    """
    try:
        user_ids = request.data.get('user_ids', [])
        action = request.data.get('action')
        
        if not user_ids or not action:
            return Response(
                {'error': 'user_ids and action are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Additional parameters for specific actions
        kwargs = {}
        if action == 'change_role':
            kwargs['new_role'] = request.data.get('new_role')
            if not kwargs['new_role']:
                return Response(
                    {'error': 'new_role is required for change_role action'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        result = UserManagementService.bulk_update_users(user_ids, action, **kwargs)
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in bulk update: {str(e)}")
        return Response(
            {'error': 'Failed to perform bulk update'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_statistics_view(request):
    """
    Get comprehensive user statistics.
    """
    try:
        result = UserManagementService.get_user_statistics()
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting user statistics: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user statistics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activities_view(request, user_id):
    """
    Get user activity history.
    """
    try:
        page = int(request.GET.get('page', 1))
        per_page = int(request.GET.get('per_page', 20))
        
        result = UserManagementService.get_user_activities(user_id, page, per_page)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting user activities: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user activities'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_roles_view(request):
    """
    Get available user roles.
    """
    try:
        from users.models import User
        roles = [{'value': choice[0], 'label': choice[1]} for choice in User.ROLE_CHOICES]
        return Response({'roles': roles}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting user roles: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user roles'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAdminUser])
def user_statuses_view(request):
    """
    Get available user statuses.
    """
    try:
        from users.models import User
        statuses = [{'value': choice[0], 'label': choice[1]} for choice in User.STATUS_CHOICES]
        return Response({'statuses': statuses}, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting user statuses: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user statuses'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activity_stats_view(request):
    """
    Get user activity statistics (active/inactive/online/offline counts).
    """
    try:
        from users.services.user_activity_tracker import UserActivityTracker
        stats = UserActivityTracker.get_activity_stats()
        return Response(stats, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting activity stats: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve activity statistics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_activity_summary_view(request, user_id):
    """
    Get activity summary for a specific user.
    """
    try:
        from users.models import User
        from users.services.user_activity_tracker import UserActivityTracker
        
        user = User.objects.get(id=user_id)
        summary = UserActivityTracker.get_user_activity_summary(user)
        return Response(summary, status=status.HTTP_200_OK)
        
    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting user activity summary: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve user activity summary'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_profile_image_view(request):
    """
    Upload profile image for current user.
    """
    try:
        if 'image' not in request.FILES:
            return Response(
                {'error': 'No image file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['image']
        logger.info(f"Received file: name={image_file.name}, size={image_file.size}, type={image_file.content_type}")
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
        if image_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Only JPEG, PNG, and GIF are allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (5MB max)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {'error': 'File too large. Maximum size is 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update user's avatar
        user = request.user
        if user.avatar:
            user.avatar.delete(save=False)
        
        # Write file directly to disk
        avatar_dir = os.path.join(settings.MEDIA_ROOT, 'avatars')
        os.makedirs(avatar_dir, exist_ok=True)
        
        # Sanitize filename
        filename = image_file.name.replace(' ', '_')
        file_path = os.path.join(avatar_dir, filename)
        
        # Read and write file
        image_file.seek(0)
        file_content = image_file.read()
        with open(file_path, 'wb') as f:
            f.write(file_content)
        
        logger.info(f"Wrote {len(file_content)} bytes to {file_path}")
        
        # Update user model with explicit field update
        from django.db.models import F
        from users.models import User
        User.objects.filter(pk=user.pk).update(avatar=f'avatars/{filename}')
        user.refresh_from_db()
        
        return Response({
            'avatar_url': user.avatar.url if user.avatar else None
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error uploading profile image: {str(e)}", exc_info=True)
        return Response(
            {'error': 'Failed to upload profile image'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_user_online_status_view(request, user_id):
    """
    Set user online status.
    """
    try:
        status_val = request.data.get('status', 'offline')
        result = UserManagementService.set_user_online_status(user_id, status_val)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        logger.error(f"Error setting user online status: {str(e)}")
        return Response(
            {'error': 'Failed to set user online status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_online_status_view(request, user_id):
    """
    Get user online status.
    """
    try:
        result = UserManagementService.get_user_online_status(user_id)
        return Response(result, status=status.HTTP_200_OK)
        
    except ValidationError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Error getting user online status: {str(e)}")
        return Response(
            {'error': 'Failed to get user online status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_online_users_view(request):
    """
    Get list of online users.
    """
    try:
        from users.models import User
        users = User.objects.filter(online_status='online').values(
            'id', 'username', 'email', 'online_status', 'last_seen', 'role', 'status'
        ).order_by('-last_seen')
        
        return Response({
            'online_users': list(users),
            'count': len(list(users))
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting online users: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve online users'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_heartbeat_view(request):
    """
    Update user activity heartbeat - keeps user online and updates last_seen.
    """
    try:
        from users.services.simple_online_status import update_user_last_seen, mark_user_online
        from users.models import User
        user = request.user
        
        # Check if account is active
        if not user.is_active or user.status in ['inactive', 'suspended', 'banned']:
            return Response({
                'message': 'Account is not active',
                'online_status': 'offline',
            }, status=status.HTTP_403_FORBIDDEN)
        
        update_user_last_seen(user.id)
        mark_user_online(user.id)
        
        return Response({
            'message': 'Heartbeat recorded',
            'online_status': 'online',
            'last_seen': timezone.now().isoformat(),
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error recording heartbeat: {str(e)}")
        return Response(
            {'error': 'Failed to record heartbeat'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
