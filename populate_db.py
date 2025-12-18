#!/usr/bin/env python
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserActivity, UserSession, BlacklistedToken, IPAddress
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

def populate_users():
    users_data = [
        {'username': 'alice_johnson', 'email': 'alice.johnson@example.com', 'first_name': 'Alice', 'last_name': 'Johnson', 'role': 'user', 'status': 'active'},
        {'username': 'bob_smith', 'email': 'bob.smith@example.com', 'first_name': 'Bob', 'last_name': 'Smith', 'role': 'moderator', 'status': 'active'},
        {'username': 'charlie_brown', 'email': 'charlie.brown@example.com', 'first_name': 'Charlie', 'last_name': 'Brown', 'role': 'user', 'status': 'pending'},
        {'username': 'diana_prince', 'email': 'diana.prince@example.com', 'first_name': 'Diana', 'last_name': 'Prince', 'role': 'user', 'status': 'suspended'},
        {'username': 'eve_adams', 'email': 'eve.adams@example.com', 'first_name': 'Eve', 'last_name': 'Adams', 'role': 'user', 'status': 'active'},
    ]
    
    for user_data in users_data:
        if not User.objects.filter(username=user_data['username']).exists() and not User.objects.filter(email=user_data['email']).exists():
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password='password123',
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                status=user_data['status']
            )
            print(f"Created user: {user.username}")
        else:
            print(f"User {user_data['username']} already exists")

def populate_user_activities():
    users = User.objects.all()[:8]
    activities = ['login', 'logout', 'message_sent', 'profile_updated', 'password_changed']
    
    for user in users:
        for i, activity in enumerate(activities):
            UserActivity.objects.create(
                user=user,
                action=activity,
                description=f"User {user.username} performed {activity}",
                ip_address=f"192.168.1.{10+i}",
                timestamp=timezone.now() - timedelta(days=i)
            )
    print(f"Created {len(users) * len(activities)} user activities")

def populate_ip_addresses():
    ip_data = [
        {'ip_address': '192.168.1.10', 'country': 'USA', 'city': 'New York', 'is_threat': False},
        {'ip_address': '192.168.1.11', 'country': 'Canada', 'city': 'Toronto', 'is_threat': False},
        {'ip_address': '10.0.0.1', 'country': 'UK', 'city': 'London', 'is_threat': False},
        {'ip_address': '172.16.0.1', 'country': 'Germany', 'city': 'Berlin', 'is_threat': True},
        {'ip_address': '203.0.113.1', 'country': 'Australia', 'city': 'Sydney', 'is_threat': False},
    ]
    
    for ip_info in ip_data:
        IPAddress.objects.get_or_create(
            ip_address=ip_info['ip_address'],
            defaults={
                'country': ip_info['country'],
                'city': ip_info['city'],
                'is_threat': ip_info['is_threat'],
                'request_count': 10
            }
        )
    print(f"Created {len(ip_data)} IP addresses")

def populate_user_sessions():
    users = User.objects.all()[:5]
    
    for i, user in enumerate(users):
        UserSession.objects.create(
            user=user,
            session_key=f"session_key_{i}_{user.username}",
            ip_address=f"192.168.1.{10+i}",
            user_agent=f"Mozilla/5.0 (User {i})",
            expires_at=timezone.now() + timedelta(hours=24)
        )
    print(f"Created {len(users)} user sessions")

if __name__ == '__main__':
    print("Populating database with sample data...")
    populate_users()
    populate_user_activities()
    populate_ip_addresses()
    populate_user_sessions()
    print("Database population complete!")