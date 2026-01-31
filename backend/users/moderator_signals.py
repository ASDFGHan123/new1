"""
Signals for moderator actions and automatic moderation.
"""
from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone
from datetime import timedelta
from users.moderator_models import ModerationAction, ModeratorProfile
from admin_panel.models import AuditLog
import logging

logger = logging.getLogger(__name__)


@receiver(post_save, sender=ModerationAction)
def handle_moderation_action(sender, instance, created, **kwargs):
    """Handle moderation action creation."""
    if not created:
        return
    
    try:
        # Update moderator profile stats
        mod_profile = instance.moderator.moderator_profile
        
        if instance.action_type == 'warning':
            mod_profile.warnings_issued += 1
        elif instance.action_type == 'suspend':
            mod_profile.suspensions_issued += 1
        elif instance.action_type == 'ban':
            mod_profile.bans_issued += 1
        elif instance.action_type == 'delete_message':
            mod_profile.messages_deleted += 1
        
        mod_profile.last_moderation_action = timezone.now()
        mod_profile.save()
        
        # Log to audit
        AuditLog.log_action(
            action_type=AuditLog.ActionType.SUSPICIOUS_ACTIVITY,
            description=f'Moderation action: {instance.get_action_type_display()}',
            actor=instance.moderator,
            target_type=AuditLog.TargetType.USER if instance.target_user else AuditLog.TargetType.MESSAGE,
            target_id=str(instance.target_user.id) if instance.target_user else instance.target_id,
            severity=AuditLog.SeverityLevel.WARNING,
            metadata={
                'action_type': instance.action_type,
                'reason': instance.reason,
                'duration': instance.duration
            }
        )
    except Exception as e:
        logger.error(f"Error handling moderation action: {str(e)}")


@receiver(post_save, sender=ModeratorProfile)
def handle_moderator_profile_update(sender, instance, created, **kwargs):
    """Handle moderator profile updates."""
    if created:
        try:
            # Log moderator assignment
            AuditLog.log_action(
                action_type=AuditLog.ActionType.ROLE_CHANGED,
                description=f'User {instance.user.username} assigned as moderator',
                actor=None,
                target_type=AuditLog.TargetType.USER,
                target_id=str(instance.user.id),
                severity=AuditLog.SeverityLevel.WARNING,
                metadata={'role': instance.role.name if instance.role else 'Unassigned'}
            )
        except Exception as e:
            logger.error(f"Error logging moderator profile creation: {str(e)}")


def check_expired_moderation_actions():
    """
    Check and expire moderation actions that have passed their duration.
    Should be called periodically (e.g., via Celery task).
    """
    now = timezone.now()
    
    # Find expired suspensions
    expired_actions = ModerationAction.objects.filter(
        is_active=True,
        action_type='suspend',
        expires_at__lte=now
    )
    
    for action in expired_actions:
        try:
            # Reactivate user
            if action.target_user:
                action.target_user.activate_user()
            
            # Mark action as inactive
            action.is_active = False
            action.save()
            
            # Log the action
            AuditLog.log_action(
                action_type=AuditLog.ActionType.USER_ACTIVATED,
                description=f'User {action.target_user.username} suspension expired',
                actor=None,
                target_type=AuditLog.TargetType.USER,
                target_id=str(action.target_user.id),
                severity=AuditLog.SeverityLevel.INFO
            )
        except Exception as e:
            logger.error(f"Error expiring moderation action: {str(e)}")
