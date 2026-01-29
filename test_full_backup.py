#!/usr/bin/env python
"""
Test full backup creation
"""
import requests
import json
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000/api"
USERNAME = "ahmad5"
PASSWORD = "admin123"

def login_and_get_token():
    """Login and get authentication token"""
    login_data = {
        "username": USERNAME,
        "password": PASSWORD
    }
    
    response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        token = data.get('tokens', {}).get('access')
        return token
    return None

def test_full_backup(token):
    """Test full backup creation"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    backup_data = {
        "name": "Test_Full_Backup",
        "description": "Test full backup via API",
        "backup_type": "full"
    }
    
    print("Creating full backup...")
    response = requests.post(f"{BASE_URL}/admin/backups/", json=backup_data, headers=headers)
    
    if response.status_code == 201:
        data = response.json()
        backup_id = data.get('id')
        print(f"✅ Full backup creation started. ID: {backup_id}")
        
        # Wait and check status
        for i in range(30):  # Wait up to 30 seconds
            time.sleep(1)
            status_resp = requests.get(f"{BASE_URL}/admin/backups/{backup_id}/status/", headers=headers)
            if status_resp.status_code == 200:
                status_data = status_resp.json()
                status = status_data.get('status')
                progress = status_data.get('progress', 0)
                print(f"Status: {status}, Progress: {progress}%")
                
                if status == 'completed':
                    print("✅ Full backup completed successfully!")
                    return True
                elif status == 'failed':
                    error = status_data.get('error', 'Unknown error')
                    print(f"❌ Full backup failed: {error}")
                    return False
        
        print("⏰ Backup timed out")
        return False
    else:
        print(f"❌ Failed to create backup: {response.status_code} - {response.text}")
        return False

if __name__ == '__main__':
    print("🔧 Testing Full Backup")
    print("=" * 40)
    
    token = login_and_get_token()
    if token:
        success = test_full_backup(token)
        if success:
            print("🎉 Full backup test successful!")
        else:
            print("❌ Full backup test failed!")
    else:
        print("❌ Login failed")
