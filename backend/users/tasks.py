"""
Celery tasks for user management.
"""
from celery import shared_task
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)


@shared_task
def cleanup_online_status():
    """Mark users as offline if no heartbeat for 20 seconds."""
    try:
        out = call_command('cleanup_online_status')
        return out
    except Exception as e:
        logger.error(f"Error in cleanup_online_status task: {str(e)}")
        return f"Error: {str(e)}"
