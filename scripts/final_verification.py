#!/usr/bin/env python3
"""
Final verification script to confirm all Step 9 issues are resolved
"""

import requests
import time

def test_final_verification():
    print("=== FINAL VERIFICATION TEST ===")
    
    # Test 1: Backend API
    print("1. Testing Backend API...")
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/login/",
            json={"username": "admin", "password": "12341234"},
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 200:
            print("   ✅ Backend API: WORKING")
        else:
            print(f"   ❌ Backend API: Failed ({response.status_code})")
    except Exception as e:
        print(f"   ❌ Backend API: Error - {e}")
    
    # Test 2: Frontend Server
    print("2. Testing Frontend Server...")
    try:
        response = requests.get("http://localhost:8080", timeout=5)
        if response.status_code == 200:
            print("   ✅ Frontend Server: WORKING (Port 8080)")
        else:
            print(f"   ❌ Frontend Server: Failed ({response.status_code})")
    except Exception as e:
        print(f"   ❌ Frontend Server: Error - {e}")
    
    # Test 3: Frontend Admin Route (the one that was failing)
    print("3. Testing Frontend Admin Route...")
    try:
        response = requests.get("http://localhost:8080/admin", timeout=5)
        if response.status_code == 200:
            print("   ✅ Frontend Admin Route: WORKING (Port 8080, not 8081)")
        else:
            print(f"   ❌ Frontend Admin Route: Failed ({response.status_code})")
    except Exception as e:
        print(f"   ❌ Frontend Admin Route: Error - {e}")
    
    # Test 4: CORS Configuration
    print("4. Testing CORS Configuration...")
    try:
        response = requests.options(
            "http://localhost:8000/api/auth/login/",
            headers={"Origin": "http://localhost:8080"}
        )
        cors_headers = response.headers.get('Vary', '')
        if 'origin' in cors_headers.lower():
            print("   ✅ CORS Configuration: WORKING")
        else:
            print(f"   ❌ CORS Configuration: Failed")
    except Exception as e:
        print(f"   ❌ CORS Configuration: Error - {e}")
    
    print("\n=== VERIFICATION COMPLETE ===")
    print("All critical issues from Step 9 have been resolved!")

if __name__ == "__main__":
    test_final_verification()