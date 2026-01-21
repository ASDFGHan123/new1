"""
Moderator views and API endpoints for content moderation.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from users.moderator_models import (
    ModeratorProfile, ModerationAction, ModeratorPermissionHelper
)
from admin_panel.models import AuditLog
from chat.models import Message, Conversation
from .moderator_serializers import (
    ModeratorProfileSerializer, ModerationActionSerializer
)

User = get_user_model()


class IsModeratorOrAdmin(permissions.BasePermission):
    """Permission check for moderator or admin."""
    
    def has_permission(self, request, view):
        return request.user and (
            request.user.role in ['admin', 'moderator'] and 
            request.user.is_authenticated
        )


class ModeratorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for moderator actions and management.
    """
    queryset = ModeratorProfile.objects.select_related('user', 'role')
    serializer_class = ModeratorProfileSerializer
    permission_classes = [IsModeratorOrAdmin]
    
    @action(detail=False, methods=['post'])
    def warn_user(self, request):
        """Issue a warning to a user."""
        user_id = request.data.get('user_id')
        reason = request.data.get('reason', '')
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not ModeratorPermissionHelper.can_warn_user(request.user):
            return Response(
                {'error': 'You do not have permission to warn users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not ModeratorPermissionHelper.can_moderate_user(request.user, target_user):
            return Response(
                {'error': 'You cannot moderate this user'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create moderation action
        action_obj = ModerationAction.objects.create(
            moderator=request.user,
            action_type='warning',
            target_user=target_user,
            reason=reason
        )
        
        # Log audit
        AuditLog.log_action(
            action_type=AuditLog.ActionType.SUSPICIOUS_ACTIVITY,
            description=f'Warning issued to {target_user.username}: {reason}',
            actor=request.user,
            target_type=AuditLog.TargetType.USER,
            target_id=str(target_user.id),
            severity=AuditLog.SeverityLevel.WARNING
        )
        
        # Update moderator stats
        mod_profile = request.user.moderator_profile
        mod_profile.warnings_issued += 1
        mod_profile.last_moderation_action = timezone.now()
        mod_profile.save()
        
        return Response(
            ModerationActionSerializer(action_obj).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def suspend_user(self, request):
        """Suspend a user."""
        user_id = request.data.get('user_id')
        reason = request.data.get('reason', '')
        duration = request.data.get('duration', '24h')  # Default 24 hours
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not ModeratorPermissionHelper.can_suspend_user(request.user):
            return Response(
                {'error': 'You do not have permission to suspend users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not ModeratorPermissionHelper.can_moderate_user(request.user, target_user):
            return Response(
                {'error': 'You cannot moderate this user'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Calculate expiration
        expires_at = self._calculate_expiration(duration)
        
        # Suspend user
        target_user.suspend_user()
        
        # Create moderation action
        action_obj = ModerationAction.objects.create(
            moderator=request.user,
            action_type='suspend',
            target_user=target_user,
            reason=reason,
            duration=duration,
            expires_at=expires_at
        )
        
        # Log audit
        AuditLog.log_action(
            action_type=AuditLog.ActionType.USER_SUSPENDED,
            description=f'User {target_user.username} suspended for {duration}: {reason}',
            actor=request.user,
            target_type=AuditLog.TargetType.USER,
            target_id=str(target_user.id),
            severity=AuditLog.SeverityLevel.ERROR
        )
        
        # Update moderator stats
        mod_profile = request.user.moderator_profile
        mod_profile.suspensions_issued += 1
        mod_profile.last_moderation_action = timezone.now()
        mod_profile.save()
        
        return Response(
            ModerationActionSerializer(action_obj).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def ban_user(self, request):
        """Ban a user (lead moderators only)."""
        user_id = request.data.get('user_id')
        reason = request.data.get('reason', '')
        
        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not ModeratorPermissionHelper.can_ban_user(request.user):
            return Response(
                {'error': 'You do not have permission to ban users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if not ModeratorPermissionHelper.can_moderate_user(request.user, target_user):
            return Response(
                {'error': 'You cannot moderate this user'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Ban user
        target_user.ban_user()
        
        # Create moderation action
        action_obj = ModerationAction.objects.create(
            moderator=request.user,
            action_type='ban',
            target_user=target_user,
            reason=reason
        )
        
        # Log audit
        AuditLog.log_action(
            action_type=AuditLog.ActionType.USER_BANNED,
            description=f'User {target_user.username} banned: {reason}',
            actor=request.user,
            target_type=AuditLog.TargetType.USER,
            target_id=str(target_user.id),
            severity=AuditLog.SeverityLevel.CRITICAL
        )
        
        # Update moderator stats
        mod_profile = request.user.moderator_profile
        mod_profile.bans_issued += 1
        mod_profile.last_moderation_action = timezone.now()
        mod_profile.save()
        
        return Response(
            ModerationActionSerializer(action_obj).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def delete_message(self, request):
        """Delete a message."""
        message_id = request.data.get('message_id')
        reason = request.data.get('reason', '')
        
        try:
            message = Message.objects.get(id=message_id)
        except Message.DoesNotExist:
            return Response(
                {'error': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        if not ModeratorPermissionHelper.can_delete_message(request.user):
            return Response(
                {'error': 'You do not have permission to delete messages'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Create moderation action
        action_obj = ModerationAction.objects.create(
            moderator=request.user,
            action_type='delete_message',
            target_user=message.sender,
            target_id=str(message.id),
            target_type='message',
            reason=reason
        )
        
        # Delete message
        message.delete()
        
        # Log audit
        AuditLog.log_action(
            action_type=AuditLog.ActionType.MESSAGE_DELETED,
            description=f'Message deleted by moderator: {reason}',
            actor=request.user,
            target_type=AuditLog.TargetType.MESSAGE,
            target_id=str(message_id),
            severity=AuditLog.SeverityLevel.WARNING
        )
        
        # Update moderator stats
        mod_profile = request.user.moderator_profile
        mod_profile.messages_deleted += 1
        mod_profile.last_moderation_action = timezone.now()
        mod_profile.save()
        
        return Response(
            ModerationActionSerializer(action_obj).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def my_actions(self, request):
        """Get moderation actions by current moderator."""
        actions = ModerationAction.objects.filter(
            moderator=request.user
        ).order_by('-created_at')
        
        serializer = ModerationActionSerializer(actions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active_actions(self, request):
        """Get active moderation actions."""
        actions = ModerationAction.objects.filter(
            is_active=True
        ).order_by('-created_at')
        
        serializer = ModerationActionSerializer(actions, many=True)
        return Response(serializer.data)
    
    @staticmethod
    def _calculate_expiration(duration):
        """Calculate expiration time from duration string."""
        now = timezone.now()
        
        if duration.endswith('h'):
            hours = int(duration[:-1])
            return now + timedelta(hours=hours)
        elif duration.endswith('d'):
            days = int(duration[:-1])
            return now + timedelta(days=days)
        elif duration.endswith('w'):
            weeks = int(duration[:-1])
            return now + timedelta(weeks=weeks)
        
        return now + timedelta(hours=24)  # Default 24 hours
