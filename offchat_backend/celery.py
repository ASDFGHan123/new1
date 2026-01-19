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
    'check-offline-users': {
        'task': 'users.tasks.check_and_mark_offline_users',
        'schedule': crontab(minute='*/1'),  # Run every minute
    },
}

app.conf.timezone = 'UTC'
