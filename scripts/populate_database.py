#!/usr/bin/env python3
"""
Populate database with initial data for admin system
"""

import os
import sys
import django
from django.contrib.auth.hashers import make_password

if os.environ.get('OFFCHAT_ALLOW_SEED_SCRIPTS') != '1':
    raise SystemExit(
        'Refusing to run seed/demo data script. Set OFFCHAT_ALLOW_SEED_SCRIPTS=1 to explicitly allow.'
    )

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models import User

def create_admin_user():
    """Create admin user if it doesn't exist"""
    try:
        admin_user = User.objects.get(username='admin')
        print(f"Admin user already exists: {admin_user.username}")
    except User.DoesNotExist:
        admin_user = User.objects.create(
            username='admin',
            email='admin@offchat.com',
            password=make_password('12341234'),
            first_name='Admin',
            last_name='User',
            role='admin',
            status='active',
            is_staff=True,
            is_superuser=True,
            is_active=True,
            email_verified=True
        )
        print(f"Created admin user: {admin_user.username}")
    return admin_user

def create_sample_users():
    """Create sample users for testing"""
    sample_users = [
        {
            'username': 'john_doe',
            'email': 'john@example.com',
            'password': 'password123',
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'user',
            'status': 'active'
        },
        {
            'username': 'jane_smith',
            'email': 'jane@example.com',
            'password': 'password123',
            'first_name': 'Jane',
            'last_name': 'Smith',
            'role': 'user',
            'status': 'active'
        },
        {
            'username': 'moderator1',
            'email': 'mod@example.com',
            'password': 'password123',
            'first_name': 'Mod',
            'last_name': 'User',
            'role': 'moderator',
            'status': 'active'
        }
    ]
    
    created_users = []
    for user_data in sample_users:
        try:
            user = User.objects.get(username=user_data['username'])
            print(f"User already exists: {user.username}")
        except User.DoesNotExist:
            user = User.objects.create(
                username=user_data['username'],
                email=user_data['email'],
                password=make_password(user_data['password']),
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                status=user_data['status'],
                is_active=True,
                email_verified=True
            )
            print(f"Created user: {user.username}")
            created_users.append(user)
    
    return created_users

def main():
    print("=== POPULATING DATABASE ===")
    
    # Create admin user
    admin_user = create_admin_user()
    
    # Create sample users
    sample_users = create_sample_users()
    
    # Print summary
    total_users = User.objects.count()
    print(f"\nDatabase populated successfully!")
    print(f"Total users in database: {total_users}")
    print(f"Admin user: admin / 12341234")
    print(f"Sample users created: {len(sample_users)}")

if __name__ == "__main__":
    main()