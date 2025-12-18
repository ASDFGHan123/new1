#!/usr/bin/env python
import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from users.models import UserActivity, UserSession, BlacklistedToken, IPAddress, SuspiciousActivity, IPAccessLog
from datetime import datetime, timedelta
from django.utils import timezone
import random

User = get_user_model()

def create_comprehensive_data():
    """Create comprehensive data for all tables"""
    
    # 1. Create more users if needed
    users_data = [
        {'username': 'moderator1', 'email': 'mod1@example.com', 'first_name': 'Sarah', 'last_name': 'Wilson', 'role': 'moderator', 'status': 'active'},
        {'username': 'user_active1', 'email': 'active1@example.com', 'first_name': 'Mike', 'last_name': 'Johnson', 'role': 'user', 'status': 'active'},
        {'username': 'user_active2', 'email': 'active2@example.com', 'first_name': 'Lisa', 'last_name': 'Davis', 'role': 'user', 'status': 'active'},
        {'username': 'user_pending1', 'email': 'pending1@example.com', 'first_name': 'Tom', 'last_name': 'Brown', 'role': 'user', 'status': 'pending'},
        {'username': 'user_suspended1', 'email': 'susp1@example.com', 'first_name': 'Anna', 'last_name': 'Miller', 'role': 'user', 'status': 'suspended'},
    ]
    
    created_users = []
    for user_data in users_data:
        if not User.objects.filter(username=user_data['username']).exists():
            user = User.objects.create_user(
                username=user_data['username'],
                email=user_data['email'],
                password='password123',
                first_name=user_data['first_name'],
                last_name=user_data['last_name'],
                role=user_data['role'],
                status=user_data['status'],
                online_status=random.choice(['online', 'away', 'offline']),
                message_count=random.randint(5, 100),
                report_count=random.randint(0, 5)
            )
            created_users.append(user)
            print(f"Created user: {user.username}")
    
    # 2. Update existing users with realistic data
    all_users = User.objects.all()
    for user in all_users:
        if user.message_count == 0:
            user.message_count = random.randint(10, 200)
        if user.report_count == 0:
            user.report_count = random.randint(0, 8)
        user.online_status = random.choice(['online', 'away', 'offline'])
        user.save()
    
    print(f"Updated {all_users.count()} users with realistic data")
    
    # 3. Create comprehensive user activities
    activity_types = ['login', 'logout', 'message_sent', 'message_edited', 'message_deleted', 
                     'profile_updated', 'group_joined', 'group_left', 'file_uploaded', 
                     'status_changed', 'password_changed', 'email_verified']
    
    for user in all_users[:10]:  # Limit to first 10 users
        for i in range(random.randint(5, 15)):
            UserActivity.objects.create(
                user=user,
                action=random.choice(activity_types),
                description=f"User {user.username} performed action",
                ip_address=f"192.168.1.{random.randint(1, 254)}",
                timestamp=timezone.now() - timedelta(days=random.randint(0, 30))
            )
    
    print(f"Created user activities for 10 users")
    
    # 4. Create IP addresses with geolocation
    ip_data = [
        {'ip': '192.168.1.10', 'country': 'USA', 'city': 'New York', 'threat': False},
        {'ip': '192.168.1.11', 'country': 'Canada', 'city': 'Toronto', 'threat': False},
        {'ip': '10.0.0.1', 'country': 'UK', 'city': 'London', 'threat': False},
        {'ip': '172.16.0.1', 'country': 'Germany', 'city': 'Berlin', 'threat': True},
        {'ip': '203.0.113.1', 'country': 'Australia', 'city': 'Sydney', 'threat': False},
        {'ip': '198.51.100.1', 'country': 'France', 'city': 'Paris', 'threat': False},
        {'ip': '203.0.113.50', 'country': 'Japan', 'city': 'Tokyo', 'threat': False},
        {'ip': '198.51.100.50', 'country': 'Brazil', 'city': 'São Paulo', 'threat': True},
    ]
    
    for ip_info in ip_data:
        IPAddress.objects.get_or_create(
            ip_address=ip_info['ip'],
            defaults={
                'country': ip_info['country'],
                'city': ip_info['city'],
                'is_threat': ip_info['threat'],
                'request_count': random.randint(10, 500),
                'blocked_until': timezone.now() + timedelta(hours=24) if ip_info['threat'] else None
            }
        )
    
    print(f"Created {len(ip_data)} IP addresses")
    
    # 5. Create user sessions
    active_users = all_users.filter(status='active')[:8]
    for i, user in enumerate(active_users):
        UserSession.objects.get_or_create(
            user=user,
            session_key=f"session_{user.id}_{random.randint(1000, 9999)}",
            defaults={
                'ip_address': f"192.168.1.{10+i}",
                'user_agent': f"Mozilla/5.0 (User {user.username})",
                'expires_at': timezone.now() + timedelta(hours=24),
                'is_active': random.choice([True, False])
            }
        )
    
    print(f"Created sessions for {active_users.count()} users")
    
    # 6. Create IP access logs
    for i in range(50):
        user = random.choice(all_users)
        IPAccessLog.objects.create(
            ip_address=f"192.168.1.{random.randint(1, 254)}",
            method=random.choice(['GET', 'POST', 'PUT', 'DELETE']),
            path=random.choice(['/api/auth/login/', '/api/users/', '/api/chat/', '/admin/']),
            user_agent=f"Mozilla/5.0 Browser {i}",
            user=user,
            status_code=random.choice([200, 201, 400, 401, 403, 404, 500]),
            response_time=random.uniform(0.1, 2.0),
            is_suspicious=random.choice([True, False]),
            country=random.choice(['USA', 'Canada', 'UK', 'Germany', 'France']),
            city=random.choice(['New York', 'Toronto', 'London', 'Berlin', 'Paris'])
        )
    
    print("Created 50 IP access logs")
    
    # 7. Create suspicious activities
    suspicious_types = ['rapid_requests', 'failed_logins', 'unusual_location', 
                       'sql_injection', 'xss_attempt', 'path_traversal', 
                       'brute_force', 'bot_activity', 'malicious_file']
    
    for i in range(20):
        SuspiciousActivity.objects.create(
            ip_address=f"192.168.1.{random.randint(1, 254)}",
            user=random.choice(all_users) if random.choice([True, False]) else None,
            activity_type=random.choice(suspicious_types),
            description=f"Suspicious activity detected: {random.choice(suspicious_types)}",
            severity=random.choice(['low', 'medium', 'high', 'critical']),
            is_resolved=random.choice([True, False]),
            metadata={'details': f'Activity {i}', 'count': random.randint(1, 10)}
        )
    
    print("Created 20 suspicious activities")
    
    # 8. Create blacklisted tokens
    for user in all_users[:5]:
        BlacklistedToken.objects.create(
            token=f"blacklisted_token_{user.id}_{random.randint(1000, 9999)}",
            user=user,
            token_type=random.choice(['access', 'refresh']),
            expires_at=timezone.now() + timedelta(hours=1)
        )
    
    print("Created blacklisted tokens for 5 users")

def print_summary():
    """Print summary of all data"""
    print("\n" + "="*50)
    print("DATABASE SUMMARY")
    print("="*50)
    print(f"Users: {User.objects.count()}")
    print(f"  - Active: {User.objects.filter(status='active').count()}")
    print(f"  - Pending: {User.objects.filter(status='pending').count()}")
    print(f"  - Suspended: {User.objects.filter(status='suspended').count()}")
    print(f"  - Online: {User.objects.filter(online_status='online').count()}")
    print(f"User Activities: {UserActivity.objects.count()}")
    print(f"User Sessions: {UserSession.objects.count()}")
    print(f"IP Addresses: {IPAddress.objects.count()}")
    print(f"IP Access Logs: {IPAccessLog.objects.count()}")
    print(f"Suspicious Activities: {SuspiciousActivity.objects.count()}")
    print(f"Blacklisted Tokens: {BlacklistedToken.objects.count()}")
    print("="*50)

if __name__ == '__main__':
    print("Creating comprehensive database data...")
    create_comprehensive_data()
    print_summary()
    print("Database population complete!")