#!/usr/bin/env python3
"""
Debug script to test analytics API endpoints
"""

import requests
import json

def test_login_and_get_token():
    """Login and get access token"""
    url = "http://localhost:8000/api/auth/login/"
    data = {
        "username": "admin",
        "password": "12341234"
    }
    
    try:
        response = requests.post(url, json=data)
        if response.status_code == 200:
            response_data = response.json()
            if 'tokens' in response_data:
                return response_data['tokens']['access']
        print(f"Login failed: {response.status_code} - {response.text}")
        return None
    except Exception as e:
        print(f"Login error: {e}")
        return None

def test_analytics_endpoints(token):
    """Test all analytics endpoints"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    endpoints = [
        "/api/analytics/dashboard/stats/",
        "/api/analytics/data/", 
        "/api/analytics/audit-logs/",
        "/api/admin/analytics/",  # This is what frontend is calling
    ]
    
    for endpoint in endpoints:
        url = f"http://localhost:8000{endpoint}"
        print(f"\n=== Testing {endpoint} ===")
        
        try:
            response = requests.get(url, headers=headers)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:500]}...")
            
            if response.status_code == 200:
                data = response.json()
                print(f"Success! Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        except Exception as e:
            print(f"Error: {e}")

def create_sample_analytics_data(token):
    """Create some sample analytics data"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Generate sample message data for charts
    sample_data = {
        "messageData": [
            {"time": "00:00", "messages": 45},
            {"time": "04:00", "messages": 12},
            {"time": "08:00", "messages": 89},
            {"time": "12:00", "messages": 156},
            {"time": "16:00", "messages": 203},
            {"time": "20:00", "messages": 178}
        ],
        "messageTypeData": [
            {"type": "Text", "count": 1250, "color": "#3b82f6"},
            {"type": "Image", "count": 340, "color": "#10b981"},
            {"type": "File", "count": 120, "color": "#f59e0b"},
            {"type": "Voice", "count": 85, "color": "#ef4444"}
        ],
        "dailyStats": [
            {"day": "Mon", "sent": 245, "delivered": 240, "read": 220},
            {"day": "Tue", "sent": 189, "delivered": 185, "read": 170},
            {"day": "Wed", "sent": 298, "delivered": 295, "read": 280},
            {"day": "Thu", "sent": 267, "delivered": 260, "read": 245},
            {"day": "Fri", "sent": 334, "delivered": 330, "read": 315},
            {"day": "Sat", "sent": 156, "delivered": 150, "read": 140},
            {"day": "Sun", "sent": 123, "delivered": 120, "read": 110}
        ]
    }
    
    print(f"\nSample analytics data structure:")
    print(json.dumps(sample_data, indent=2))
    return sample_data

if __name__ == "__main__":
    print("=== ANALYTICS DEBUG SCRIPT ===")
    
    # Get auth token
    token = test_login_and_get_token()
    if not token:
        print("Failed to get auth token, exiting")
        exit(1)
    
    print(f"Got token: {token[:20]}...")
    
    # Test analytics endpoints
    test_analytics_endpoints(token)
    
    # Show sample data structure
    create_sample_analytics_data(token)