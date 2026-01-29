#!/usr/bin/env python
"""
Test PDF backup functionality through the API
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

def test_backup_download(token):
    """Test backup download"""
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    # Get latest completed backup
    response = requests.get(f"{BASE_URL}/admin/backups/", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        backups = data.get('results', [])
        
        # Find a completed backup
        completed_backup = None
        for backup in backups:
            if backup.get('status') == 'completed':
                completed_backup = backup
                break
        
        if completed_backup:
            backup_id = completed_backup['id']
            print(f"Found completed backup: {backup_id}")
            
            # Test download
            download_response = requests.get(f"{BASE_URL}/admin/backups/{backup_id}/download/", headers=headers)
            
            if download_response.status_code == 200:
                print(f"✅ Download successful! Size: {len(download_response.content)} bytes")
                print(f"Content-Type: {download_response.headers.get('Content-Type', 'Unknown')}")
                return True
            else:
                print(f"❌ Download failed: {download_response.status_code}")
                print(f"Response: {download_response.text}")
                return False
        else:
            print("❌ No completed backups found")
            return False
    else:
        print(f"❌ Failed to get backups: {response.status_code}")
        return False

if __name__ == '__main__':
    print("🔧 Testing Backup Download")
    print("=" * 40)
    
    token = login_and_get_token()
    if token:
        success = test_backup_download(token)
        if success:
            print("🎉 Backup download test successful!")
        else:
            print("❌ Backup download test failed!")
    else:
        print("❌ Login failed")
