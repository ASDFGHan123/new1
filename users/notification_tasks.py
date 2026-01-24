"""
Celery tasks for notification management.
"""
from celery import shared_task
from users.notification_utils import send_notification, send_bulk_notification
from users.models import User
from utils.json_utils import prepare_metadata
import logging

logger = logging.getLogger(__name__)


@shared_task
def send_notification_async(user_id, notification_type, title, message, data=None):
    """Send notification asynchronously via Celery."""
    try:
        user = User.objects.get(id=user_id)
        send_notification(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            data=prepare_metadata(data or {})
        )
        return f"Notification sent to user {user_id}"
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found for notification")
        return f"User {user_id} not found"
    except Exception as e:
        logger.error(f"Error sending notification to user {user_id}: {str(e)}")
        raise


@shared_task
def send_bulk_notification_async(user_ids=None, notification_type=None, title=None, message=None, data=None, admin_role=None):
    """Send bulk notifications asynchronously via Celery."""
    try:
        if admin_role:
            # Filter by role (for admin notifications)
            users = User.objects.filter(role=admin_role, is_active=True)
        else:
            # Filter by user IDs
            users = User.objects.filter(id__in=user_ids or [])
        
        if not users.exists():
            return "No users found for notification"
        
        send_bulk_notification(
            users=users,
            notification_type=notification_type,
            title=title,
            message=message,
            data=prepare_metadata(data or {})
        )
        return f"Notifications sent to {users.count()} users"
    except Exception as e:
        logger.error(f"Error sending bulk notifications: {str(e)}")
        raise


@shared_task
def cleanup_old_notifications(days=30):
    """Clean up old read notifications older than specified days."""
    from django.utils import timezone
    from datetime import timedelta
    from users.models_notification import Notification
    
    try:
        cutoff_date = timezone.now() - timedelta(days=days)
        deleted_count, _ = Notification.objects.filter(
            is_read=True,
            created_at__lt=cutoff_date
        ).delete()
        return f"Deleted {deleted_count} old notifications"
    except Exception as e:
        logger.error(f"Error cleaning up old notifications: {str(e)}")
        raise
