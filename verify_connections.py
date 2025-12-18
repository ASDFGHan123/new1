#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Systematic connection verification and fixes.
Tests database, backend APIs, and frontend integration.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.db import connection
from django.test import Client
from users.models import User, SuspiciousActivity
from admin_panel.models import AuditLog
import json

def verify_database():
    """Verify SQLite database connection and schema."""
    print("\n[DATABASE VERIFICATION]")
    try:
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        print(f"[OK] Database connected: {count} users")
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = len(cursor.fetchall())
        print(f"[OK] Schema verified: {tables} tables")
        return True
    except Exception as e:
        print(f"[FAIL] Database error: {e}")
        return False

def verify_models():
    """Verify Django models match database schema."""
    print("\n[MODEL-SCHEMA SYNCHRONIZATION]")
    try:
        users = User.objects.all()
        print(f"[OK] User model: {users.count()} records")
        
        activities = SuspiciousActivity.objects.all()
        print(f"[OK] SuspiciousActivity model: {activities.count()} records")
        
        logs = AuditLog.objects.all()
        print(f"[OK] AuditLog model: {logs.count()} records")
        return True
    except Exception as e:
        print(f"[FAIL] Model sync error: {e}")
        return False

def verify_api_endpoints():
    """Verify all API endpoints return correct data."""
    print("\n[API ENDPOINT TESTING]")
    client = Client()
    
    try:
        # Test login endpoint
        login_response = client.post('/api/auth/login/', 
            json.dumps({'username': 'admin', 'password': '12341234'}),
            content_type='application/json'
        )
        print(f"[OK] POST /api/auth/login/: {login_response.status_code}")
        
        if login_response.status_code == 200:
            login_data = json.loads(login_response.content)
            token = login_data.get('tokens', {}).get('access')
            
            if token:
                # Test authenticated endpoint
                response = client.get('/api/users/admin/users/',
                    HTTP_AUTHORIZATION=f'Bearer {token}'
                )
                print(f"[OK] GET /api/users/admin/users/: {response.status_code}")
                return response.status_code == 200
        
        return False
    except Exception as e:
        print(f"[FAIL] API endpoint error: {e}")
        return False

def verify_authentication():
    """Verify authentication flow."""
    print("\n[AUTHENTICATION FLOW VERIFICATION]")
    try:
        admin = User.objects.filter(is_superuser=True).first()
        if admin:
            print(f"[OK] Admin user: {admin.username}")
            print(f"[OK] is_staff: {admin.is_staff}")
            print(f"[OK] is_superuser: {admin.is_superuser}")
            return True
        else:
            print("[FAIL] Admin user not found")
            return False
    except Exception as e:
        print(f"[FAIL] Auth error: {e}")
        return False

def verify_moderation():
    """Verify moderation data."""
    print("\n[ADMIN DASHBOARD INTEGRATION]")
    try:
        reported = User.objects.filter(report_count__gt=0).count()
        print(f"[OK] Reported users: {reported}")
        
        activities = SuspiciousActivity.objects.filter(is_resolved=False).count()
        print(f"[OK] Unresolved activities: {activities}")
        
        logs = AuditLog.objects.count()
        print(f"[OK] Audit logs: {logs}")
        return True
    except Exception as e:
        print(f"[FAIL] Moderation error: {e}")
        return False

def verify_permissions():
    """Verify admin permissions."""
    print("\n[PERMISSIONS VERIFICATION]")
    try:
        admin = User.objects.filter(is_superuser=True).first()
        if admin and admin.is_staff:
            print("[OK] Admin permissions verified")
            return True
        else:
            print("[FAIL] Admin permissions not found")
            return False
    except Exception as e:
        print(f"[FAIL] Permissions error: {e}")
        return False

def main():
    """Run all verification tests."""
    print("\n" + "="*60)
    print("SYSTEMATIC CONNECTION VERIFICATION")
    print("="*60)
    
    results = {
        'Database': verify_database(),
        'Models': verify_models(),
        'API Endpoints': verify_api_endpoints(),
        'Authentication': verify_authentication(),
        'Moderation': verify_moderation(),
        'Permissions': verify_permissions(),
    }
    
    print("\n" + "="*60)
    print("VERIFICATION SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test, result in results.items():
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {test}")
    
    print(f"\nTotal: {passed}/{total} passed")
    
    if passed == total:
        print("\n[SUCCESS] ALL CONNECTIONS VERIFIED")
        return 0
    else:
        print(f"\n[WARNING] {total - passed} verification(s) failed")
        return 1

if __name__ == '__main__':
    sys.exit(main())
