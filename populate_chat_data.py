#!/usr/bin/env python
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

# Check if chat models exist
try:
    from chat.models import Conversation, Message, Group, GroupMembership
    CHAT_MODELS_EXIST = True
except ImportError:
    CHAT_MODELS_EXIST = False
    print("Chat models not found, creating sample data structure...")

# Check if analytics models exist
try:
    from analytics.models import UserAnalytics, SystemMetrics
    ANALYTICS_MODELS_EXIST = True
except ImportError:
    ANALYTICS_MODELS_EXIST = False
    print("Analytics models not found, creating sample data structure...")

def populate_sample_data():
    """Create sample data even without full models"""
    users = User.objects.all()
    
    # Update user message counts
    for i, user in enumerate(users[:5]):
        user.message_count = (i + 1) * 10
        user.report_count = i
        user.save()
        print(f"Updated {user.username}: {user.message_count} messages, {user.report_count} reports")
    
    print("Sample data population complete!")

if __name__ == '__main__':
    print("Populating chat and analytics data...")
    populate_sample_data()
    print("Data population complete!")