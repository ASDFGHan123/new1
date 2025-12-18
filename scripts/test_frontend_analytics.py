#!/usr/bin/env python3
"""
Test script to verify frontend analytics integration
"""

import requests
import json

def test_analytics_flow():
    """Test the complete analytics flow"""
    
    # Step 1: Login
    print("=== Step 1: Login ===")
    login_url = "http://localhost:8000/api/auth/login/"
    login_data = {"username": "admin", "password": "12341234"}
    
    response = requests.post(login_url, json=login_data)
    if response.status_code != 200:
        print(f"Login failed: {response.status_code}")
        return False
    
    token = response.json()['tokens']['access']
    print(f"[OK] Login successful, token: {token[:20]}...")
    
    # Step 2: Test analytics endpoint that frontend calls
    print("\n=== Step 2: Test Analytics Endpoint ===")
    analytics_url = "http://localhost:8000/api/analytics/data/"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(analytics_url, headers=headers)
    if response.status_code != 200:
        print(f"Analytics failed: {response.status_code}")
        return False
    
    data = response.json()
    print(f"[OK] Analytics endpoint working")
    
    # Step 3: Verify required data structure
    print("\n=== Step 3: Verify Data Structure ===")
    required_keys = ['messageData', 'messageTypeData', 'dailyStats']
    
    for key in required_keys:
        if key in data:
            print(f"[OK] {key}: {len(data[key])} items")
        else:
            print(f"[ERROR] Missing {key}")
            return False
    
    # Step 4: Verify chart data format
    print("\n=== Step 4: Verify Chart Data Format ===")
    
    # Check messageData format
    if data['messageData'] and 'time' in data['messageData'][0] and 'messages' in data['messageData'][0]:
        print("[OK] messageData format correct")
    else:
        print("[ERROR] messageData format incorrect")
        return False
    
    # Check messageTypeData format  
    if data['messageTypeData'] and 'type' in data['messageTypeData'][0] and 'count' in data['messageTypeData'][0]:
        print("[OK] messageTypeData format correct")
    else:
        print("[ERROR] messageTypeData format incorrect")
        return False
    
    # Check dailyStats format
    if data['dailyStats'] and 'day' in data['dailyStats'][0] and 'sent' in data['dailyStats'][0]:
        print("[OK] dailyStats format correct")
    else:
        print("[ERROR] dailyStats format incorrect")
        return False
    
    print("\n=== SUCCESS: Analytics data is ready for frontend! ===")
    print(f"Sample messageData: {data['messageData'][:2]}")
    print(f"Sample messageTypeData: {data['messageTypeData'][:2]}")
    print(f"Sample dailyStats: {data['dailyStats'][:2]}")
    
    return True

if __name__ == "__main__":
    print("=== FRONTEND ANALYTICS INTEGRATION TEST ===")
    success = test_analytics_flow()
    
    if success:
        print("\n[SUCCESS] All tests passed! Frontend should now display analytics charts.")
        print("[INFO] Refresh your browser at http://localhost:5173/admin to see the charts.")
    else:
        print("\n[FAILED] Tests failed. Check the errors above.")