from django.db.models.signals import post_save
from django.dispatch import receiver
from users.models import UserActivity
import logging

logger = logging.getLogger(__name__)


ACTIVITY_NOTIFICATION_MAP = {
    'login': {
        'type': 'system',
        'title': 'Login Detected',
        'message': 'You logged in to your account'
    },
    'logout': {
        'type': 'system',
        'title': 'Logout Detected',
        'message': 'You logged out from your account'
    },
    'message_sent': {
        'type': 'message',
        'title': 'Message Sent',
        'message': 'Your message was sent successfully'
    },
    'message_edited': {
        'type': 'message',
        'title': 'Message Edited',
        'message': 'Your message was edited'
    },
    'message_deleted': {
        'type': 'message',
        'title': 'Message Deleted',
        'message': 'Your message was deleted'
    },
    'profile_updated': {
        'type': 'profile_update',
        'title': 'Profile Updated',
        'message': 'Your profile has been updated'
    },
    'group_joined': {
        'type': 'system',
        'title': 'Group Joined',
        'message': 'You joined a new group'
    },
    'group_left': {
        'type': 'system',
        'title': 'Group Left',
        'message': 'You left a group'
    },
    'file_uploaded': {
        'type': 'system',
        'title': 'File Uploaded',
        'message': 'Your file was uploaded successfully'
    },
    'status_changed': {
        'type': 'system',
        'title': 'Status Changed',
        'message': 'Your status has been updated'
    },
    'password_changed': {
        'type': 'system',
        'title': 'Password Changed',
        'message': 'Your password has been changed'
    },
    'email_verified': {
        'type': 'system',
        'title': 'Email Verified',
        'message': 'Your email has been verified'
    },
}


@receiver(post_save, sender=UserActivity)
def send_activity_notification(sender, instance, created, **kwargs):
    """Send notification when user activity is recorded."""
    if not created:
        return
    
    activity_config = ACTIVITY_NOTIFICATION_MAP.get(instance.action)
    if not activity_config:
        return
    
    try:
        from users.notification_tasks import send_notification_async
        
        try:
            send_notification_async.delay(
                user_id=instance.user.id,
                notification_type=activity_config['type'],
                title=activity_config['title'],
                message=activity_config['message'],
                data={'activity_id': str(instance.id), 'action': instance.action}
            )
        except Exception as celery_error:
            logger.warning(f"Celery task failed, falling back to sync: {str(celery_error)}")
            from users.notification_utils import send_notification
            try:
                send_notification(
                    user=instance.user,
                    notification_type=activity_config['type'],
                    title=activity_config['title'],
                    message=activity_config['message'],
                    data={'activity_id': str(instance.id), 'action': instance.action}
                )
            except Exception as sync_error:
                logger.error(f"Failed to send notification: {str(sync_error)}")
    except Exception as e:
        logger.error(f"Error in send_activity_notification: {str(e)}")
