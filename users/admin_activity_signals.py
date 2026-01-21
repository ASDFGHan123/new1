"""
Admin Activity Notification Signals
Automatically triggers admin notifications for all system activities
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.signals import request_started
from users.models import UserActivity
from users.admin_activity_notifier import AdminActivityNotifier
from chat.models import Message, Group, GroupMember, Conversation
from admin_panel.models import AuditLog
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# USER ACTIVITY SIGNALS
# ============================================================================

@receiver(post_save, sender=UserActivity)
def notify_on_user_activity(sender, instance, created, **kwargs):
    """Notify admins when user activities are recorded"""
    if not created:
        return
    
    try:
        activity_map = {
            'login': 'USER_LOGIN',
            'logout': 'USER_LOGOUT',
            'message_sent': 'MESSAGE_SENT',
            'profile_updated': 'USER_UPDATED',
            'status_changed': 'USER_UPDATED',
            'password_changed': 'PASSWORD_CHANGED',
            'email_verified': 'EMAIL_VERIFIED',
        }
        
        activity_type = activity_map.get(instance.action)
        if activity_type:
            AdminActivityNotifier.notify_on_user_activity(
                user=instance.user,
                activity_type=activity_type,
                metadata={'username': instance.user.username}
            )
    except Exception as e:
        logger.error(f"Error notifying on user activity: {str(e)}")


# ============================================================================
# MESSAGE SIGNALS
# ============================================================================

@receiver(post_save, sender=Message)
def notify_on_message_activity(sender, instance, created, **kwargs):
    """Notify admins when messages are created"""
    if not created:
        return
    
    try:
        if instance.message_type != Message.MessageType.SYSTEM:
            AdminActivityNotifier.notify_on_message_activity(
                message=instance,
                activity_type='MESSAGE_SENT',
                actor=instance.sender
            )
    except Exception as e:
        logger.error(f"Error notifying on message creation: {str(e)}")


@receiver(post_delete, sender=Message)
def notify_on_message_delete(sender, instance, **kwargs):
    """Notify admins when messages are deleted"""
    try:
        AdminActivityNotifier.notify_on_message_activity(
            message=instance,
            activity_type='MESSAGE_DELETED',
            actor=instance.sender
        )
    except Exception as e:
        logger.error(f"Error notifying on message deletion: {str(e)}")


# ============================================================================
# GROUP SIGNALS
# ============================================================================

@receiver(post_save, sender=Group)
def notify_on_group_activity(sender, instance, created, **kwargs):
    """Notify admins when groups are created or updated"""
    try:
        if created:
            AdminActivityNotifier.notify_on_group_activity(
                group=instance,
                activity_type='GROUP_CREATED',
                actor=instance.created_by
            )
    except Exception as e:
        logger.error(f"Error notifying on group activity: {str(e)}")


@receiver(post_save, sender=GroupMember)
def notify_on_group_member_activity(sender, instance, created, **kwargs):
    """Notify admins when members join/leave groups"""
    try:
        if created and instance.status == GroupMember.MemberStatus.ACTIVE:
            AdminActivityNotifier.notify_on_group_activity(
                group=instance.group,
                activity_type='GROUP_JOINED',
                actor=instance.user,
                metadata={'username': instance.user.username}
            )
    except Exception as e:
        logger.error(f"Error notifying on group member activity: {str(e)}")


# ============================================================================
# CONVERSATION SIGNALS
# ============================================================================

@receiver(post_save, sender=Conversation)
def notify_on_conversation_activity(sender, instance, created, **kwargs):
    """Notify admins when conversations are created"""
    try:
        if created:
            AdminActivityNotifier.notify_admins(
                activity_type='CONVERSATION_CREATED',
                target_type='CONVERSATION',
                target_id=instance.id,
                metadata={'conversation': str(instance)}
            )
    except Exception as e:
        logger.error(f"Error notifying on conversation activity: {str(e)}")


# ============================================================================
# AUDIT LOG SIGNALS
# ============================================================================

@receiver(post_save, sender=AuditLog)
def notify_on_audit_log(sender, instance, created, **kwargs):
    """Notify admins about critical audit log events"""
    if not created:
        return
    
    try:
        # Only notify for critical and high severity events
        if instance.severity in [AuditLog.SeverityLevel.CRITICAL, AuditLog.SeverityLevel.ERROR]:
            AdminActivityNotifier.notify_admins(
                activity_type=instance.action_type,
                actor=instance.actor,
                target_type=instance.target_type,
                target_id=instance.target_id,
                metadata={
                    'description': instance.description,
                    'ip_address': instance.ip_address,
                    'severity': instance.severity
                },
                severity=instance.severity
            )
    except Exception as e:
        logger.error(f"Error notifying on audit log: {str(e)}")
