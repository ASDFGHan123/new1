#!/usr/bin/env python3
"""
Test users API endpoint
"""

import requests
import json

def test_users_api():
    # First login to get token
    login_url = "http://localhost:8000/api/auth/login/"
    login_data = {
        "username": "admin",
        "password": "12341234"
    }
    
    login_response = requests.post(login_url, json=login_data)
    if login_response.status_code != 200:
        print("Login failed")
        return
    
    token = login_response.json()['tokens']['access']
    print(f"Got token: {token[:20]}...")
    
    # Test users API
    users_url = "http://localhost:8000/api/users/admin/users/"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    print(f"\nTesting users API: {users_url}")
    users_response = requests.get(users_url, headers=headers)
    print(f"Status: {users_response.status_code}")
    print(f"Response: {users_response.text}")

if __name__ == "__main__":
    test_users_api()