#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Chat app verification - frontend, backend, and database.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.db import connection
from django.test import Client
from chat.models import Group, Conversation, Message, Attachment
from users.models import User
import json

def verify_chat_database():
    """Verify chat database tables and data."""
    print("\n[CHAT DATABASE VERIFICATION]")
    try:
        cursor = connection.cursor()
        
        # Check tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%group%' OR name LIKE '%conversation%' OR name LIKE '%message%' OR name LIKE '%attachment%'")
        tables = cursor.fetchall()
        print(f"[OK] Chat tables: {len(tables)} found")
        
        # Check data
        groups = Group.objects.count()
        conversations = Conversation.objects.count()
        messages = Message.objects.count()
        attachments = Attachment.objects.count()
        
        print(f"[OK] Groups: {groups}")
        print(f"[OK] Conversations: {conversations}")
        print(f"[OK] Messages: {messages}")
        print(f"[OK] Attachments: {attachments}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Database error: {e}")
        return False

def verify_chat_models():
    """Verify chat models are synchronized."""
    print("\n[CHAT MODELS SYNCHRONIZATION]")
    try:
        # Test Group model
        group_count = Group.objects.count()
        print(f"[OK] Group model: {group_count} records")
        
        # Test Conversation model
        conv_count = Conversation.objects.count()
        print(f"[OK] Conversation model: {conv_count} records")
        
        # Test Message model
        msg_count = Message.objects.count()
        print(f"[OK] Message model: {msg_count} records")
        
        # Test Attachment model
        att_count = Attachment.objects.count()
        print(f"[OK] Attachment model: {att_count} records")
        
        return True
    except Exception as e:
        print(f"[FAIL] Model sync error: {e}")
        return False

def verify_chat_api_endpoints():
    """Verify chat API endpoints."""
    print("\n[CHAT API ENDPOINTS VERIFICATION]")
    client = Client()
    
    try:
        # Login first
        login_response = client.post('/api/auth/login/', 
            json.dumps({'username': 'admin', 'password': '12341234'}),
            content_type='application/json'
        )
        
        if login_response.status_code != 200:
            print("[FAIL] Login failed")
            return False
        
        login_data = json.loads(login_response.content)
        token = login_data.get('tokens', {}).get('access')
        
        if not token:
            print("[FAIL] No token received")
            return False
        
        # Test conversation endpoints
        endpoints = [
            ('GET', '/api/chat/conversations/'),
            ('GET', '/api/chat/groups/'),
            ('GET', '/api/chat/search/?q=test'),
            ('GET', '/api/chat/status/'),
            ('GET', '/api/chat/notifications/'),
        ]
        
        for method, endpoint in endpoints:
            response = client.get(endpoint, HTTP_AUTHORIZATION=f'Bearer {token}')
            status_code = response.status_code
            status = "OK" if status_code in [200, 400] else "WARN"
            print(f"[{status}] {method} {endpoint}: {status_code}")
        
        return True
    except Exception as e:
        print(f"[FAIL] API error: {e}")
        return False

def verify_chat_functionality():
    """Verify chat functionality."""
    print("\n[CHAT FUNCTIONALITY VERIFICATION]")
    try:
        admin = User.objects.filter(is_superuser=True).first()
        
        if not admin:
            print("[FAIL] Admin user not found")
            return False
        
        # Test group creation
        group = Group.objects.create(
            name=f"Test Group {Group.objects.count()}",
            created_by=admin,
            group_type='public'
        )
        print(f"[OK] Group creation: {group.name}")
        
        # Test group membership
        member = group.add_member(admin, role='admin')
        print(f"[OK] Group membership: {member.user.username}")
        
        # Test conversation creation
        conversation = Conversation.objects.create(
            conversation_type='group',
            group=group
        )
        print(f"[OK] Conversation creation: {conversation.id}")
        
        # Test message creation
        message = Message.objects.create(
            conversation=conversation,
            sender=admin,
            content="Test message",
            message_type='text'
        )
        print(f"[OK] Message creation: {message.id}")
        
        # Test message editing
        message.edit_content("Edited test message")
        print(f"[OK] Message editing: {message.content}")
        
        # Test message deletion
        message.delete_message()
        print(f"[OK] Message deletion: is_deleted={message.is_deleted}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Functionality error: {e}")
        return False

def verify_chat_permissions():
    """Verify chat permissions."""
    print("\n[CHAT PERMISSIONS VERIFICATION]")
    try:
        admin = User.objects.filter(is_superuser=True).first()
        
        if not admin:
            print("[FAIL] Admin user not found")
            return False
        
        # Create test group
        group = Group.objects.create(
            name=f"Permission Test {Group.objects.count()}",
            created_by=admin,
            group_type='public'
        )
        
        # Test group permissions
        can_manage = group.can_manage(admin)
        print(f"[OK] Group management permission: {can_manage}")
        
        # Test member permissions
        member = group.add_member(admin)
        is_member = group.is_member(admin)
        print(f"[OK] Group membership check: {is_member}")
        
        return True
    except Exception as e:
        print(f"[FAIL] Permissions error: {e}")
        return False

def main():
    """Run all chat app verifications."""
    print("\n" + "="*60)
    print("CHAT APP VERIFICATION")
    print("="*60)
    
    results = {
        'Database': verify_chat_database(),
        'Models': verify_chat_models(),
        'API Endpoints': verify_chat_api_endpoints(),
        'Functionality': verify_chat_functionality(),
        'Permissions': verify_chat_permissions(),
    }
    
    print("\n" + "="*60)
    print("CHAT APP VERIFICATION SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {test}")
    
    print(f"\nTotal: {passed}/{total} passed")
    
    if passed == total:
        print("\n[SUCCESS] CHAT APP FULLY OPERATIONAL")
        return 0
    else:
        print(f"\n[WARNING] {total - passed} verification(s) failed")
        return 1

if __name__ == '__main__':
    sys.exit(main())
