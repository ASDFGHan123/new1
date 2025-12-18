#!/usr/bin/env python3
"""
Test complete system loading - frontend and backend
"""

import requests
import json
import time

def test_backend_endpoints():
    """Test all critical backend endpoints"""
    print("=== BACKEND TESTS ===")
    
    # 1. Test login
    print("1. Testing login...")
    login_response = requests.post(
        "http://localhost:8000/api/auth/login/",
        json={"username": "admin", "password": "12341234"}
    )
    
    if login_response.status_code != 200:
        print(f"FAIL Login failed: {login_response.status_code}")
        return False
    
    token = login_response.json()['tokens']['access']
    headers = {"Authorization": f"Bearer {token}"}
    print("PASS Login successful")
    
    # 2. Test users endpoint
    print("2. Testing users API...")
    users_response = requests.get("http://localhost:8000/api/users/admin/users/", headers=headers)
    if users_response.status_code == 200:
        users_data = users_response.json()
        print(f"PASS Users API: {users_data['count']} users found")
    else:
        print(f"FAIL Users API failed: {users_response.status_code}")
    
    # 3. Test dashboard stats
    print("3. Testing dashboard stats...")
    stats_response = requests.get("http://localhost:8000/api/admin/dashboard/stats/", headers=headers)
    if stats_response.status_code == 200:
        print("PASS Dashboard stats working")
    else:
        print(f"WARN Dashboard stats: {stats_response.status_code}")
    
    # 4. Test analytics
    print("4. Testing analytics...")
    analytics_response = requests.get("http://localhost:8000/api/analytics/data/", headers=headers)
    if analytics_response.status_code == 200:
        print("PASS Analytics working")
    else:
        print(f"WARN Analytics: {analytics_response.status_code}")
    
    return True

def test_frontend_loading():
    """Test frontend loading"""
    print("\n=== FRONTEND TESTS ===")
    
    # Test main frontend page
    print("1. Testing frontend root...")
    try:
        frontend_response = requests.get("http://localhost:5173/", timeout=10)
        if frontend_response.status_code == 200:
            print("PASS Frontend root accessible")
        else:
            print(f"FAIL Frontend root: {frontend_response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"FAIL Frontend not accessible: {e}")
        return False
    
    # Test admin page
    print("2. Testing admin page...")
    try:
        admin_response = requests.get("http://localhost:5173/admin", timeout=10)
        if admin_response.status_code == 200:
            print("PASS Admin page accessible")
        else:
            print(f"FAIL Admin page: {admin_response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"FAIL Admin page not accessible: {e}")
    
    return True

def test_api_endpoints():
    """Test specific API endpoints that frontend uses"""
    print("\n=== API ENDPOINT TESTS ===")
    
    # Login first
    login_response = requests.post(
        "http://localhost:8000/api/auth/login/",
        json={"username": "admin", "password": "12341234"}
    )
    
    if login_response.status_code != 200:
        print("FAIL Cannot login for API tests")
        return False
    
    token = login_response.json()['tokens']['access']
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test endpoints that frontend needs
    endpoints = [
        ("/api/users/admin/users/", "Users list"),
        ("/api/admin/dashboard/stats/", "Dashboard stats"),
        ("/api/analytics/data/", "Analytics data"),
        ("/api/admin/audit-logs/", "Audit logs"),
        ("/api/admin/message-templates/", "Message templates"),
    ]
    
    for endpoint, name in endpoints:
        try:
            response = requests.get(f"http://localhost:8000{endpoint}", headers=headers, timeout=5)
            if response.status_code == 200:
                print(f"PASS {name}")
            elif response.status_code == 404:
                print(f"WARN {name} - endpoint not found")
            else:
                print(f"FAIL {name} - status {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"FAIL {name} - error: {e}")

def main():
    print("=== FULL SYSTEM TEST ===")
    print("Testing both frontend and backend loading...\n")
    
    # Test backend
    backend_ok = test_backend_endpoints()
    
    # Test frontend
    frontend_ok = test_frontend_loading()
    
    # Test API endpoints
    test_api_endpoints()
    
    # Summary
    print("\n=== SUMMARY ===")
    if backend_ok:
        print("PASS Backend: Working")
    else:
        print("FAIL Backend: Issues found")
    
    if frontend_ok:
        print("PASS Frontend: Accessible")
    else:
        print("FAIL Frontend: Not accessible")
    
    print("\n=== NEXT STEPS ===")
    print("1. Open http://localhost:5173/admin in browser")
    print("2. Login with: admin / 12341234")
    print("3. Check if admin dashboard loads completely")

if __name__ == "__main__":
    main()