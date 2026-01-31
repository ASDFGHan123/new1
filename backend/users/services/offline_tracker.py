"""
Service to manage automatic user offline status based on inactivity.
"""
from django.utils import timezone
from datetime import timedelta
from users.models import User
import logging

logger = logging.getLogger(__name__)

INACTIVITY_TIMEOUT_MINUTES = 30  # User goes offline after 30 minutes of inactivity


def mark_inactive_users_offline():
    """
    Mark users as offline if they haven't been active for INACTIVITY_TIMEOUT_MINUTES.
    Call this periodically via Celery or management command.
    """
    try:
        timeout_threshold = timezone.now() - timedelta(minutes=INACTIVITY_TIMEOUT_MINUTES)
        
        # Find online users who haven't been active recently
        inactive_users = User.objects.filter(
            online_status='online',
            last_seen__lt=timeout_threshold
        )
        
        count = inactive_users.count()
        if count > 0:
            inactive_users.update(online_status='offline')
            logger.info(f"Marked {count} users as offline due to inactivity")
        
        return count
    except Exception as e:
        logger.error(f"Error marking inactive users offline: {str(e)}")
        return 0
