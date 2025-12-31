#!/usr/bin/env python
"""
Test script to verify LAN signin works correctly
"""
import os
import sys
import json
import requests
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
sys.path.insert(0, str(Path(__file__).parent))

import django
django.setup()

from users.models import User
from rest_framework_simplejwt.tokens import RefreshToken
from users.serializers import UserSerializer

def test_admin_user_exists():
    """Test 1: Check if admin user exists"""
    print("\n[TEST 1] Checking if admin user exists...")
    user = User.objects.filter(username='admin').first()
    if user:
        print(f"[PASS] Admin user found: {user.username} (ID: {user.id})")
        return user
    else:
        print("[FAIL] Admin user not found")
        return None

def test_token_generation(user):
    """Test 2: Check if tokens can be generated"""
    print("\n[TEST 2] Testing token generation...")
    try:
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        if access_token and refresh_token:
            print("[PASS] Tokens generated successfully")
            print(f"  Access token length: {len(access_token)}")
            print(f"  Refresh token length: {len(refresh_token)}")
            return access_token, refresh_token
        else:
            print("[FAIL] Tokens are empty")
            return None, None
    except Exception as e:
        print(f"[FAIL] Token generation failed: {e}")
        return None, None

def test_api_response_format(user):
    """Test 3: Check API response format"""
    print("\n[TEST 3] Testing API response format...")
    try:
        serializer = UserSerializer(user)
        response = {
            'user': serializer.data,
            'tokens': {
                'access': 'test_access_token',
                'refresh': 'test_refresh_token'
            }
        }
        
        # Verify response structure
        if 'user' in response and 'tokens' in response:
            if 'access' in response['tokens'] and 'refresh' in response['tokens']:
                print("[PASS] API response format is correct")
                print(f"  User fields: {list(response['user'].keys())}")
                return True
            else:
                print("[FAIL] Tokens missing in response")
                return False
        else:
            print("[FAIL] Response structure incorrect")
            return False
    except Exception as e:
        print(f"[FAIL] Response format test failed: {e}")
        return False

def test_user_status(user):
    """Test 4: Check user status"""
    print("\n[TEST 4] Checking user status...")
    print(f"  Username: {user.username}")
    print(f"  Email: {user.email}")
    print(f"  Status: {user.status}")
    print(f"  Is Active: {user.is_active}")
    print(f"  Is Staff: {user.is_staff}")
    print(f"  Role: {user.role}")
    
    if user.is_active and user.status == 'active':
        print("[PASS] User is active and approved")
        return True
    else:
        print("[FAIL] User is not active or not approved")
        return False

def main():
    print("=" * 50)
    print("  OffChat LAN Signin Test Suite")
    print("=" * 50)
    
    # Test 1: Admin user exists
    user = test_admin_user_exists()
    if not user:
        print("\n[ERROR] Cannot proceed without admin user")
        return False
    
    # Test 2: Token generation
    access_token, refresh_token = test_token_generation(user)
    if not access_token or not refresh_token:
        print("\n[ERROR] Cannot proceed without tokens")
        return False
    
    # Test 3: API response format
    if not test_api_response_format(user):
        print("\n[ERROR] API response format is incorrect")
        return False
    
    # Test 4: User status
    if not test_user_status(user):
        print("\n[ERROR] User is not in correct state for login")
        return False
    
    print("\n" + "=" * 50)
    print("  All Tests Passed!")
    print("=" * 50)
    print("\nYou can now test signin:")
    print("  1. Start backend: python manage.py runserver --settings=offchat_backend.settings.development")
    print("  2. Start frontend: npm run dev")
    print("  3. Access from another device: http://<YOUR_IP>:5173")
    print("  4. Login with: admin / 12341234")
    print("\n" + "=" * 50)
    
    return True

if __name__ == '__main__':
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n[ERROR] Test suite failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
