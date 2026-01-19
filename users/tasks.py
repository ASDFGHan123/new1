"""
Celery tasks for user management.
"""
from celery import shared_task
from users.services.simple_online_status import mark_inactive_users_offline
import logging

logger = logging.getLogger(__name__)


@shared_task
def check_and_mark_offline_users():
    """Celery task to check and mark inactive users as offline. Runs every minute."""
    try:
        count = mark_inactive_users_offline()
        return f"Marked {count} users as offline"
    except Exception as e:
        logger.error(f"Error in check_and_mark_offline_users task: {str(e)}")
        return f"Error: {str(e)}"
