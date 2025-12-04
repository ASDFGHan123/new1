#!/usr/bin/env python3
"""
Comprehensive database and authentication debug script.
"""
import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings')
django.setup()

from users.models import User
from django.contrib.auth import authenticate
import requests
import json

def test_database_connectivity():
    print("=== DATABASE CONNECTIVITY TEST ===")
    
    try:
        # Test database connection
        total_users = User.objects.count()
        print(f"[SUCCESS] Database connected successfully")
        print(f"Total users in database: {total_users}")
        
        # Check for admin users
        admin_users = User.objects.filter(role='admin')
        print(f"Admin users found: {admin_users.count()}")
        
        if admin_users.count() > 0:
            for admin in admin_users:
                print(f"   - Username: {admin.username}")
                print(f"   - Email: {admin.email}")
                print(f"   - Status: {admin.status}")
                print(f"   - Is Active: {admin.is_active}")
                print(f"   - Is Staff: {admin.is_staff}")
                print(f"   - Is Superuser: {admin.is_superuser}")
        else:
            print("[ERROR] No admin users found - creating one...")
            create_admin_user()
            
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        return False
    
    return True

def create_admin_user():
    """Create admin user if not exists"""
    try:
        # Create admin user
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'role': 'admin',
                'status': 'active',
                'is_active': True,
                'is_staff': True,
                'is_superuser': True,
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            print(f"[SUCCESS] Created new admin user: admin")
        else:
            print(f"[INFO] Admin user already exists: admin")
            
        # Verify password
        user = authenticate(username='admin', password='admin123')
        if user:
            print(f"[SUCCESS] Password verification successful for admin")
        else:
            print(f"[ERROR] Password verification failed for admin")
            admin_user.set_password('admin123')
            admin_user.save()
            print(f"[RESET] Reset admin password")
            
    except Exception as e:
        print(f"[ERROR] Failed to create admin user: {e}")

def test_api_authentication():
    print("\n=== API AUTHENTICATION TEST ===")
    
    base_url = "http://localhost:8000/api"
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        # Test login
        response = requests.post(
            f"{base_url}/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"API Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"[SUCCESS] API Login successful!")
            print(f"   User: {data.get('user', {}).get('username')}")
            print(f"   Role: {data.get('user', {}).get('role')}")
            
            # Test authenticated request
            access_token = data.get('tokens', {}).get('access')
            if access_token:
                headers = {"Authorization": f"Bearer {access_token}"}
                users_response = requests.get(
                    f"{base_url}/users/admin/users/",
                    headers=headers,
                    timeout=10
                )
                print(f"Authenticated request status: {users_response.status_code}")
                if users_response.status_code == 200:
                    print(f"[SUCCESS] Authenticated request successful!")
                else:
                    print(f"[ERROR] Authenticated request failed: {users_response.text}")
            else:
                print(f"[ERROR] No access token in response")
        else:
            print(f"[ERROR] API Login failed: {response.text}")
            
    except Exception as e:
        print(f"[ERROR] API test failed: {e}")

def test_password_manually():
    print("\n=== MANUAL PASSWORD TEST ===")
    
    try:
        # Test password authentication directly
        user = authenticate(username='admin', password='admin123')
        if user:
            print(f"✅ Manual authentication successful!")
            print(f"   User ID: {user.id}")
            print(f"   Username: {user.username}")
            print(f"   Role: {user.role}")
            print(f"   Status: {user.status}")
        else:
            print(f"❌ Manual authentication failed")
            print(f"   This suggests the password is incorrect in the database")
            
    except Exception as e:
        print(f"❌ Manual password test failed: {e}")

if __name__ == "__main__":
    print("Comprehensive Database & Authentication Debug")
    print("=" * 60)
    
    # Test database connectivity
    db_ok = test_database_connectivity()
    
    if db_ok:
        # Test manual password authentication
        test_password_manually()
        
        # Test API authentication
        test_api_authentication()
    else:
        print("[ERROR] Skipping authentication tests due to database issues")
    
    print("\n" + "=" * 60)
    print("Next Steps:")
    print("1. Check if admin user exists and has correct password")
    print("2. Verify API is accessible at http://localhost:8000")
    print("3. Check browser Network tab for API request failures")
    print("4. Clear browser cache and try again")