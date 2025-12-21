#!/usr/bin/env python
"""
Script to populate moderation system with test data.
Run with: python populate_moderation_data.py
"""

import os
import django
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from admin_panel.models import FlaggedMessage, UserModeration, ContentReview

User = get_user_model()

def create_test_data():
    """Create test data for moderation system."""
    
    # Get or create test users
    admin_user, _ = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@offchat.com',
            'role': 'admin',
            'status': 'active',
            'is_staff': True,
            'is_superuser': True
        }
    )
    
    test_user1, _ = User.objects.get_or_create(
        username='testuser1',
        defaults={
            'email': 'testuser1@offchat.com',
            'role': 'user',
            'status': 'active'
        }
    )
    
    test_user2, _ = User.objects.get_or_create(
        username='testuser2',
        defaults={
            'email': 'testuser2@offchat.com',
            'role': 'user',
            'status': 'active'
        }
    )
    
    test_user3, _ = User.objects.get_or_create(
        username='testuser3',
        defaults={
            'email': 'testuser3@offchat.com',
            'role': 'user',
            'status': 'active'
        }
    )
    
    print("✓ Created test users")
    
    # Create flagged messages
    flagged_messages = [
        {
            'message_id': 'msg-001',
            'message_content': 'This is spam content with links to malicious sites',
            'sender_id': str(test_user1.id),
            'sender_username': test_user1.username,
            'reason': 'spam',
            'description': 'Multiple spam links',
            'status': 'pending',
            'reported_by': admin_user,
        },
        {
            'message_id': 'msg-002',
            'message_content': 'Harassing message directed at another user',
            'sender_id': str(test_user2.id),
            'sender_username': test_user2.username,
            'reason': 'harassment',
            'description': 'Targeted harassment',
            'status': 'pending',
            'reported_by': admin_user,
        },
        {
            'message_id': 'msg-003',
            'message_content': 'Hate speech content',
            'sender_id': str(test_user3.id),
            'sender_username': test_user3.username,
            'reason': 'hate_speech',
            'description': 'Offensive language',
            'status': 'pending',
            'reported_by': admin_user,
        },
        {
            'message_id': 'msg-004',
            'message_content': 'Explicit content',
            'sender_id': str(test_user1.id),
            'sender_username': test_user1.username,
            'reason': 'explicit',
            'description': 'Adult content',
            'status': 'approved',
            'reported_by': admin_user,
            'reviewed_by': admin_user,
            'review_notes': 'False report - content is appropriate',
            'reviewed_at': timezone.now() - timedelta(days=1),
        },
    ]
    
    for msg_data in flagged_messages:
        FlaggedMessage.objects.get_or_create(
            message_id=msg_data['message_id'],
            defaults=msg_data
        )
    
    print(f"✓ Created {len(flagged_messages)} flagged messages")
    
    # Create user moderations
    moderations = [
        {
            'user': test_user1,
            'action_type': 'suspend',
            'reason': 'Repeated spam violations',
            'status': 'active',
            'duration_days': 7,
            'moderator': admin_user,
            'expires_at': timezone.now() + timedelta(days=7),
        },
        {
            'user': test_user2,
            'action_type': 'warn',
            'reason': 'First harassment warning',
            'status': 'active',
            'moderator': admin_user,
        },
        {
            'user': test_user3,
            'action_type': 'ban',
            'reason': 'Repeated hate speech violations',
            'status': 'active',
            'moderator': admin_user,
        },
    ]
    
    for mod_data in moderations:
        UserModeration.objects.get_or_create(
            user=mod_data['user'],
            action_type=mod_data['action_type'],
            defaults=mod_data
        )
    
    print(f"✓ Created {len(moderations)} user moderations")
    
    # Create content reviews
    reviews = [
        {
            'content_type': 'message',
            'content_id': 'msg-new-001',
            'content_data': {
                'text': 'New message awaiting review',
                'sender': test_user1.username,
                'timestamp': timezone.now().isoformat()
            },
            'status': 'pending',
            'priority': 2,
            'submitted_by': test_user1,
        },
        {
            'content_type': 'user_profile',
            'content_id': f'profile-{test_user2.id}',
            'content_data': {
                'username': test_user2.username,
                'bio': 'Updated bio awaiting review',
                'avatar': 'avatar.jpg'
            },
            'status': 'pending',
            'priority': 1,
            'submitted_by': test_user2,
        },
        {
            'content_type': 'group',
            'content_id': 'group-001',
            'content_data': {
                'name': 'New Group',
                'description': 'Group description awaiting review',
                'type': 'public'
            },
            'status': 'in_review',
            'priority': 3,
            'submitted_by': test_user1,
        },
        {
            'content_type': 'message',
            'content_id': 'msg-approved-001',
            'content_data': {
                'text': 'Previously approved message',
                'sender': test_user2.username,
                'timestamp': (timezone.now() - timedelta(days=1)).isoformat()
            },
            'status': 'approved',
            'priority': 1,
            'submitted_by': test_user2,
            'reviewed_by': admin_user,
            'review_notes': 'Content is appropriate',
            'reviewed_at': timezone.now() - timedelta(days=1),
        },
    ]
    
    for review_data in reviews:
        ContentReview.objects.get_or_create(
            content_id=review_data['content_id'],
            defaults=review_data
        )
    
    print(f"✓ Created {len(reviews)} content reviews")
    
    # Print summary
    print("\n" + "="*50)
    print("MODERATION SYSTEM TEST DATA CREATED")
    print("="*50)
    print(f"Flagged Messages: {FlaggedMessage.objects.count()}")
    print(f"  - Pending: {FlaggedMessage.objects.filter(status='pending').count()}")
    print(f"  - Approved: {FlaggedMessage.objects.filter(status='approved').count()}")
    print(f"User Moderations: {UserModeration.objects.count()}")
    print(f"  - Active: {UserModeration.objects.filter(status='active').count()}")
    print(f"Content Reviews: {ContentReview.objects.count()}")
    print(f"  - Pending: {ContentReview.objects.filter(status='pending').count()}")
    print(f"  - In Review: {ContentReview.objects.filter(status='in_review').count()}")
    print(f"  - Approved: {ContentReview.objects.filter(status='approved').count()}")
    print("="*50)
    print("\nYou can now access the Moderation Panel in the Admin Dashboard!")

if __name__ == '__main__':
    create_test_data()
