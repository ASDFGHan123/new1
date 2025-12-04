#!/usr/bin/env python3
"""
Quick authentication test to get a valid token and test protected endpoints
"""
import requests
import json

def main():
    # Test 1: Login to get token
    print("Testing login...")
    login_data = {
        "username": "admin",
        "password": "12341234"
    }
    
    response = requests.post("http://localhost:8000/api/auth/login/", 
                           json=login_data,
                           headers={"Content-Type": "application/json"})
    
    print(f"Login status: {response.status_code}")
    print(f"Login response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        access_token = data.get('tokens', {}).get('access')
        print(f"Access token: {access_token[:20]}...")
        
        if access_token:
            # Test 2: Test protected endpoints with valid token
            headers = {"Authorization": f"Bearer {access_token}"}
            
            # Test analytics endpoint
            print("\nTesting analytics endpoint...")
            response = requests.get("http://localhost:8000/api/analytics/system/", headers=headers)
            print(f"Analytics status: {response.status_code}")
            print(f"Analytics response: {response.text}")
            
            # Test admin dashboard endpoint
            print("\nTesting admin dashboard endpoint...")
            response = requests.get("http://localhost:8000/api/admin/dashboard/stats/", headers=headers)
            print(f"Admin dashboard status: {response.status_code}")
            print(f"Admin dashboard response: {response.text}")
            
            # Test 3: Test registration endpoint
            print("\nTesting registration endpoint...")
            register_data = {
                "username": "testuser_123",
                "email": "test@example.com",
                "password": "testpass123"
            }
            response = requests.post("http://localhost:8000/api/auth/register/", 
                                   json=register_data,
                                   headers={"Content-Type": "application/json"})
            print(f"Registration status: {response.status_code}")
            print(f"Registration response: {response.text}")
            
            # Test 4: Test logout
            print("\nTesting logout...")
            response = requests.post("http://localhost:8000/api/auth/logout/", 
                                   headers=headers)
            print(f"Logout status: {response.status_code}")
            print(f"Logout response: {response.text}")
            
            # Test 5: Test accessing protected endpoint after logout
            print("\nTesting protected endpoint after logout...")
            response = requests.get("http://localhost:8000/api/auth/profile/", headers=headers)
            print(f"Post-logout profile status: {response.status_code}")
            print(f"Post-logout profile response: {response.text}")

if __name__ == "__main__":
    main()