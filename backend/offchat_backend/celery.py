"""
Celery configuration for offchat_backend.
"""
import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')

app = Celery('offchat_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Celery Beat Schedule - Periodic Tasks
app.conf.beat_schedule = {
    'cleanup-online-status': {
        'task': 'users.tasks.cleanup_online_status',
        'schedule': 10.0,  # Run every 10 seconds
    },
}

app.conf.timezone = 'UTC'
