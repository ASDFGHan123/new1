"""
Complete online status tracking service.
"""
from django.utils import timezone
from datetime import timedelta
from users.models import User
import logging

logger = logging.getLogger(__name__)


def update_user_online_status(user_id, status='online'):
    """Update user online status immediately."""
    try:
        User.objects.filter(id=user_id).update(
            online_status=status,
            last_seen=timezone.now()
        )
        return True
    except Exception as e:
        logger.error(f"Error updating user status: {str(e)}")
        return False


def mark_inactive_users_offline():
    """Mark users offline if inactive for 2 minutes."""
    try:
        timeout = timezone.now() - timedelta(minutes=2)
        count = User.objects.filter(
            online_status='online',
            last_seen__lt=timeout
        ).update(online_status='offline')
        
        if count > 0:
            logger.info(f"Marked {count} users offline")
        return count
    except Exception as e:
        logger.error(f"Error marking users offline: {str(e)}")
        return 0


def get_online_users_count():
    """Get count of online users."""
    return User.objects.filter(online_status='online').count()


def get_user_status(user_id):
    """Get user online status."""
    try:
        user = User.objects.get(id=user_id)
        return {
            'user_id': user.id,
            'username': user.username,
            'online_status': user.online_status,
            'last_seen': user.last_seen.isoformat() if user.last_seen else None,
            'is_online': user.online_status == 'online'
        }
    except User.DoesNotExist:
        return None
