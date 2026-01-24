#!/usr/bin/env python3
import os
import django

if os.environ.get('OFFCHAT_ALLOW_SEED_SCRIPTS') != '1':
    raise SystemExit(
        'Refusing to run seed/demo data script. Set OFFCHAT_ALLOW_SEED_SCRIPTS=1 to explicitly allow.'
    )

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

def create_test_users():
    """Create some test users for the admin dashboard"""
    
    # Create test users if they don't exist
    test_users = [
        {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'password123',
            'role': 'user',
            'first_name': 'John',
            'last_name': 'Doe'
        },
        {
            'username': 'jane_smith',
            'email': 'jane@example.com',
            'password': 'password123',
            'role': 'user',
            'first_name': 'Jane',
            'last_name': 'Smith'
        },
        {
            'username': 'bob_wilson',
            'email': 'bob@example.com',
            'password': 'password123',
            'role': 'moderator',
            'first_name': 'Bob',
            'last_name': 'Wilson'
        },
        {
            'username': 'suspended_user',
            'email': 'suspended@example.com',
            'password': 'password123',
            'role': 'user',
            'status': 'suspended'
        }
    ]
    
    created_count = 0
    
    for user_data in test_users:
        username = user_data['username']
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            print(f"User {username} already exists, skipping...")
            continue
            
        # Create user
        user = User.objects.create_user(
            username=username,
            email=user_data['email'],
            password=user_data['password'],
            role=user_data['role'],
            first_name=user_data.get('first_name', ''),
            last_name=user_data.get('last_name', ''),
            status=user_data.get('status', 'active'),
            email_verified=True
        )
        
        # Set some additional fields
        user.join_date = timezone.now() - timedelta(days=30)
        user.last_seen = timezone.now() - timedelta(hours=2)
        user.message_count = 45 if user_data['role'] == 'user' else 120
        user.report_count = 1 if username == 'suspended_user' else 0
        user.save()
        
        print(f"Created user: {username} ({user_data['role']}) - Status: {user.status}")
        created_count += 1
    
    print(f"\nTotal users created: {created_count}")
    
    # Display all users
    print("\nAll users in system:")
    for user in User.objects.all().order_by('username'):
        print(f"  - {user.username} ({user.role}) - Status: {user.status} - Messages: {user.message_count}")

if __name__ == "__main__":
    create_test_users()