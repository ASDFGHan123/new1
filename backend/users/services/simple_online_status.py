"""
Simple online status tracking - direct and reliable.
"""
from django.utils import timezone
from datetime import timedelta
from users.models import User
import logging

logger = logging.getLogger(__name__)


def mark_user_online(user_id):
    """Mark user as online immediately - only if account is active."""
    try:
        from users.models import User
        user = User.objects.get(id=user_id)
        
        # Don't mark inactive/suspended/banned users as online
        if not user.is_active or user.status in ['inactive', 'suspended', 'banned']:
            logger.info(f"User {user_id} cannot be marked online - account is {user.status}")
            return False
        
        User.objects.filter(id=user_id).update(
            online_status='online',
            last_seen=timezone.now()
        )
        logger.info(f"User {user_id} marked online")
        return True
    except User.DoesNotExist:
        logger.error(f"User {user_id} not found")
        return False
    except Exception as e:
        logger.error(f"Error marking user online: {e}")
        return False


def mark_user_offline(user_id):
    """Mark user as offline immediately."""
    try:
        User.objects.filter(id=user_id).update(
            online_status='offline',
            last_seen=timezone.now()
        )
        logger.info(f"User {user_id} marked offline")
        return True
    except Exception as e:
        logger.error(f"Error marking user offline: {e}")
        return False


def update_user_last_seen(user_id):
    """Update user's last_seen timestamp."""
    try:
        User.objects.filter(id=user_id).update(last_seen=timezone.now())
        return True
    except Exception as e:
        logger.error(f"Error updating last_seen: {e}")
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
            logger.info(f"Marked {count} users offline due to inactivity")
        return count
    except Exception as e:
        logger.error(f"Error marking inactive users offline: {e}")
        return 0


def get_online_users_count():
    """Get count of online users."""
    try:
        return User.objects.filter(online_status='online').count()
    except Exception as e:
        logger.error(f"Error getting online users count: {e}")
        return 0


def get_user_online_status(user_id):
    """Get user's online status."""
    try:
        user = User.objects.get(id=user_id)
        return {
            'user_id': user.id,
            'username': user.username,
            'online_status': user.online_status,
            'last_seen': user.last_seen.isoformat() if user.last_seen else None,
        }
    except User.DoesNotExist:
        return None
    except Exception as e:
        logger.error(f"Error getting user status: {e}")
        return None
