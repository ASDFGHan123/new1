#!/usr/bin/env python3
"""
Debug authentication issues to fix remaining test failures
"""
import requests
import json

def test_registration():
    """Test user registration endpoint."""
    print("=== Testing Registration ===")
    
    # Test with proper JSON data
    import time
    timestamp = int(time.time())
    data = {
        "username": f"testuser_{timestamp}",
        "email": f"testuser_{timestamp}@example.com",
        "password": "testpass123",
        "password_confirm": "testpass123"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/api/auth/register/",
            json=data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text}")
        return response.status_code == 201
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_admin_dashboard_with_valid_token():
    """Test admin dashboard with valid token."""
    print("\n=== Testing Admin Dashboard with Valid Token ===")
    
    # First login to get valid token
    login_data = {"username": "admin", "password": "12341234"}
    
    try:
        login_response = requests.post(
            "http://localhost:8000/api/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            return False
        
        tokens = login_response.json().get('tokens', {})
        access_token = tokens.get('access')
        
        if not access_token:
            print("No access token received")
            return False
        
        print(f"Got access token: {access_token[:20]}...")
        
        # Test admin dashboard with valid token
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            "http://localhost:8000/api/admin/dashboard/stats/",
            headers=headers
        )
        
        print(f"Admin dashboard status: {response.status_code}")
        print(f"Admin dashboard response: {response.text}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_logout_invalidates_token():
    """Test that logout properly invalidates the token."""
    print("\n=== Testing Logout Token Invalidation ===")
    
    # Login to get token
    login_data = {"username": "admin", "password": "12341234"}
    
    try:
        login_response = requests.post(
            "http://localhost:8000/api/auth/login/",
            json=login_data,
            headers={"Content-Type": "application/json"}
        )
        
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.status_code}")
            return False
        
        tokens = login_response.json().get('tokens', {})
        access_token = tokens.get('access')
        
        if not access_token:
            print("No access token received")
            return False
        
        print(f"Got access token: {access_token[:20]}...")
        
        # Test protected endpoint before logout
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            "http://localhost:8000/api/auth/profile/",
            headers=headers
        )
        
        print(f"Profile access before logout: {response.status_code}")
        
        # Logout
        logout_response = requests.post(
            "http://localhost:8000/api/auth/logout/",
            headers=headers
        )
        
        print(f"Logout status: {logout_response.status_code}")
        
        # Test protected endpoint after logout
        response = requests.get(
            "http://localhost:8000/api/auth/profile/",
            headers=headers
        )
        
        print(f"Profile access after logout: {response.status_code}")
        
        return response.status_code == 401  # Should be 401 after logout
        
    except Exception as e:
        print(f"Error: {e}")
        return False

def main():
    """Run all debug tests."""
    print("Debugging Authentication Issues")
    print("=" * 50)
    
    results = []
    
    # Test 1: Registration
    reg_success = test_registration()
    results.append(("Registration", reg_success))
    
    # Test 2: Admin Dashboard
    admin_success = test_admin_dashboard_with_valid_token()
    results.append(("Admin Dashboard", admin_success))
    
    # Test 3: Logout Token Invalidation
    logout_success = test_logout_invalidates_token()
    results.append(("Logout Token Invalidation", logout_success))
    
    # Summary
    print("\n" + "=" * 50)
    print("DEBUG SUMMARY")
    print("=" * 50)
    
    for test_name, success in results:
        status = "PASS" if success else "FAIL"
        print(f"{status} {test_name}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    print(f"\nResults: {passed}/{total} tests passed")

if __name__ == "__main__":
    main()