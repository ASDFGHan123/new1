"""
Admin views for moderator management.
Add to admin_panel/views.py or create new file.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from users.moderator_models import ModeratorPermissionHelper, ModeratorProfile
from users.moderator_serializers import ModeratorProfileSerializer

User = get_user_model()


class IsAdmin(permissions.BasePermission):
    """Permission check for admin only."""
    
    def has_permission(self, request, view):
        return request.user and request.user.role == 'admin' and request.user.is_authenticated


class AdminModeratorManagementViewSet(viewsets.ViewSet):
    """
    ViewSet for admin to manage moderators.
    """
    permission_classes = [IsAdmin]
    
    @action(detail=False, methods=['post'])
    def assign_moderator(self, request):
        """Assign moderator role to a user."""
        user_id = request.data.get('user_id')
        role_type = request.data.get('role_type', 'junior')
        
        if role_type not in ['junior', 'senior', 'lead']:
            return Response(
                {'error': 'Invalid role type. Must be junior, senior, or lead'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.role == 'admin':
            return Response(
                {'error': 'Cannot assign moderator role to admin'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            profile = ModeratorPermissionHelper.assign_moderator_role(user, role_type)
            return Response(
                {
                    'success': True,
                    'message': f'User {user.username} assigned as {role_type} moderator',
                    'moderator': ModeratorProfileSerializer(profile).data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def remove_moderator(self, request):
        """Remove moderator role from a user."""
        user_id = request.data.get('user_id')
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.role != 'moderator':
            return Response(
                {'error': 'User is not a moderator'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            ModeratorPermissionHelper.remove_moderator_role(user)
            return Response(
                {
                    'success': True,
                    'message': f'Moderator role removed from {user.username}'
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def list_moderators(self, request):
        """List all moderators."""
        moderators = ModeratorProfile.objects.select_related(
            'user', 'role'
        ).filter(is_active_moderator=True)
        
        serializer = ModeratorProfileSerializer(moderators, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def moderator_stats(self, request):
        """Get moderator statistics."""
        moderators = ModeratorProfile.objects.filter(is_active_moderator=True)
        
        stats = {
            'total_moderators': moderators.count(),
            'junior_moderators': moderators.filter(role__role_type='junior').count(),
            'senior_moderators': moderators.filter(role__role_type='senior').count(),
            'lead_moderators': moderators.filter(role__role_type='lead').count(),
            'total_warnings': sum(m.warnings_issued for m in moderators),
            'total_suspensions': sum(m.suspensions_issued for m in moderators),
            'total_bans': sum(m.bans_issued for m in moderators),
            'total_messages_deleted': sum(m.messages_deleted for m in moderators),
        }
        
        return Response(stats)
