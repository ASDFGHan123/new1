#!/usr/bin/env python
"""
Test backup API endpoints using curl-like requests
"""
import requests
import json
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
USERNAME = "ahmad5"  # Staff user
PASSWORD = "admin123"  # Try common password

def login_and_get_token():
    """Login and get authentication token"""
    print("🔐 Logging in...")
    
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        
        print(f"Response status: {response.status_code}")
        print(f"Response text: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response data keys: {list(data.keys())}")
            token = data.get('tokens', {}).get('access')
            if token:
                print(f"✅ Login successful. Token: {token[:20]}...")
                return token
            else:
                print(f"❌ No token in response: {data}")
                return None
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        return None

def test_backup_creation(token):
    """Test backup creation"""
    print("\n📦 Testing backup creation...")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    backup_data = {
        "name": "Test_Backup_Endpoint",
        "description": "Test backup via API",
        "backup_type": "users"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/admin/backups/", json=backup_data, headers=headers)
        
        if response.status_code == 201:
            data = response.json()
            backup_id = data.get('id')
            print(f"✅ Backup creation successful. ID: {backup_id}")
            return backup_id
        else:
            print(f"❌ Backup creation failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Backup creation error: {str(e)}")
        return None

def test_backup_status(token, backup_id):
    """Test backup status"""
    print(f"\n📊 Testing backup status for ID: {backup_id}")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/admin/backups/{backup_id}/status/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Status: {data}")
            return data
        else:
            print(f"❌ Status check failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ Status check error: {str(e)}")
        return None

def test_backup_list(token):
    """Test backup listing"""
    print("\n📋 Testing backup list...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/admin/backups/", headers=headers)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data.get('results', []))} backups")
            for backup in data.get('results', [])[:3]:  # Show first 3
                print(f"   📦 {backup.get('name')} - {backup.get('status')} - {backup.get('backup_type')}")
            return data
        else:
            print(f"❌ List failed: {response.status_code} - {response.text}")
            return None
            
    except Exception as e:
        print(f"❌ List error: {str(e)}")
        return None

def test_backup_download(token, backup_id):
    """Test backup download"""
    print(f"\n⬇️ Testing backup download for ID: {backup_id}")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(f"{BASE_URL}/admin/backups/{backup_id}/download/", headers=headers)
        
        if response.status_code == 200:
            print(f"✅ Download successful. Size: {len(response.content)} bytes")
            return True
        else:
            print(f"❌ Download failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Download error: {str(e)}")
        return False

def main():
    print("🔧 Backup API Endpoint Test")
    print("=" * 50)
    
    # Login
    token = login_and_get_token()
    if not token:
        print("❌ Cannot proceed without authentication")
        return
    
    # Test backup list first
    test_backup_list(token)
    
    # Test backup creation
    backup_id = test_backup_creation(token)
    if not backup_id:
        print("❌ Cannot test further without backup")
        return
    
    # Wait a bit and check status
    time.sleep(2)
    status = test_backup_status(token, backup_id)
    
    # If backup is completed, test download
    if status and status.get('status') == 'completed':
        test_backup_download(token, backup_id)
    else:
        print("⏳ Backup not completed yet, skipping download test")
    
    print("\n" + "=" * 50)
    print("✅ Backup API test completed!")

if __name__ == '__main__':
    main()
