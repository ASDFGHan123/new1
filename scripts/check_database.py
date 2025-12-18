#!/usr/bin/env python3
"""
Check database tables and data for the OffChat system
"""

import os
import sys
import django
from django.db import connection

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models import User, BlacklistedToken
from chat.models import Conversation, Message, Group, GroupMember, Attachment
from admin_panel.models import AuditLog, SystemSettings, MessageTemplate, Backup, Trash
from analytics.models import UserAnalytics, SystemAnalytics, MessageMetrics

def check_tables():
    """Check if all required tables exist"""
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
    
    required_tables = [
        'users_user',
        'users_blacklistedtoken',
        'conversations',
        'messages',
        'groups',
        'group_members',
        'attachments',
        'audit_logs',
        'system_settings',
        'message_templates',
        'backups',
        'trash',
        'user_analytics',
        'system_analytics',
        'message_metrics'
    ]
    
    print("=== DATABASE TABLES ===")
    for table in required_tables:
        status = "✓" if table in tables else "✗"
        print(f"{status} {table}")
    
    print(f"\nTotal tables in database: {len(tables)}")
    return all(table in tables for table in required_tables)

def check_data():
    """Check data in each model"""
    print("\n=== DATABASE DATA ===")
    
    # Users
    users = User.objects.all()
    print(f"Users: {users.count()}")
    if users.exists():
        admin_users = users.filter(role='admin')
        print(f"  - Admin users: {admin_users.count()}")
        print(f"  - Active users: {users.filter(status='active').count()}")
        print(f"  - Pending users: {users.filter(status='pending').count()}")
        print(f"  - Suspended users: {users.filter(status='suspended').count()}")
    
    # Blacklisted tokens
    blacklisted = BlacklistedToken.objects.all()
    print(f"Blacklisted tokens: {blacklisted.count()}")
    
    # Conversations
    conversations = Conversation.objects.all()
    print(f"Conversations: {conversations.count()}")
    
    # Messages
    messages = Message.objects.all()
    print(f"Messages: {messages.count()}")
    
    # Groups
    groups = Group.objects.all()
    print(f"Groups: {groups.count()}")
    
    # Group members
    members = GroupMember.objects.all()
    print(f"Group members: {members.count()}")
    
    # Attachments
    attachments = Attachment.objects.all()
    print(f"Attachments: {attachments.count()}")
    
    # Audit logs
    logs = AuditLog.objects.all()
    print(f"Audit logs: {logs.count()}")
    
    # System settings
    settings = SystemSettings.objects.all()
    print(f"System settings: {settings.count()}")
    
    # Message templates
    templates = MessageTemplate.objects.all()
    print(f"Message templates: {templates.count()}")
    
    # Backups
    backups = Backup.objects.all()
    print(f"Backups: {backups.count()}")
    
    # Trash
    trash = Trash.objects.all()
    print(f"Trash items: {trash.count()}")
    
    # User analytics
    user_analytics = UserAnalytics.objects.all()
    print(f"User analytics: {user_analytics.count()}")
    
    # System analytics
    system_analytics = SystemAnalytics.objects.all()
    print(f"System analytics: {system_analytics.count()}")
    
    # Message metrics
    message_metrics = MessageMetrics.objects.all()
    print(f"Message metrics: {message_metrics.count()}")

def create_missing_data():
    """Create essential data if missing"""
    print("\n=== CREATING MISSING DATA ===")
    
    # Create system settings if missing
    if not SystemSettings.objects.exists():
        admin_user = User.objects.filter(role='admin').first()
        SystemSettings.objects.create(
            key='site_name',
            value='OffChat Admin',
            category='general',
            description='Site name for the application',
            updated_by=admin_user
        )
        SystemSettings.objects.create(
            key='maintenance_mode',
            value='false',
            category='general',
            description='Enable/disable maintenance mode',
            updated_by=admin_user
        )
        print("✓ Created system settings")
    
    # Create message templates if missing
    if not MessageTemplate.objects.exists():
        admin_user = User.objects.filter(role='admin').first()
        if admin_user:
            templates = [
                {
                    'name': 'Welcome Message',
                    'content': 'Welcome to OffChat! We\'re excited to have you here.',
                    'category': 'welcome',
                    'created_by': admin_user
                },
                {
                    'name': 'Maintenance Notice',
                    'content': 'The system will be undergoing maintenance from {start_time} to {end_time}.',
                    'category': 'maintenance',
                    'created_by': admin_user
                },
                {
                    'name': 'Account Suspended',
                    'content': 'Your account has been suspended due to violation of our terms of service.',
                    'category': 'security',
                    'created_by': admin_user
                }
            ]
            
            for template_data in templates:
                MessageTemplate.objects.create(**template_data)
            print(f"✓ Created {len(templates)} message templates")
    
    # Create sample group if missing
    if not Group.objects.exists():
        admin_user = User.objects.filter(role='admin').first()
        if admin_user:
            group = Group.objects.create(
                name="General Chat",
                description="General discussion for all users",
                created_by=admin_user,
                group_type='public'
            )
            
            # Add admin as owner
            GroupMember.objects.create(
                group=group,
                user=admin_user,
                role='owner'
            )
            print("✓ Created sample group")
    
    # Create user analytics for existing users
    users_without_analytics = User.objects.filter(analytics__isnull=True)
    if users_without_analytics.exists():
        for user in users_without_analytics:
            UserAnalytics.objects.create(user=user)
        print(f"✓ Created analytics for {users_without_analytics.count()} users")

def main():
    print("=== DATABASE CHECK ===")
    
    # Check tables
    tables_ok = check_tables()
    
    # Check data
    check_data()
    
    # Create missing data
    create_missing_data()
    
    # Final summary
    print("\n=== SUMMARY ===")
    if tables_ok:
        print("✓ All required tables exist")
    else:
        print("✗ Some tables are missing - run migrations")
    
    print("✓ Database check complete")

if __name__ == "__main__":
    main()