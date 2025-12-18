#!/usr/bin/env python3
"""
Debug browser authentication by checking what the frontend is actually sending.
"""
import requests
import json

def debug_browser_auth():
    base_url = "http://localhost:8000/api"
    
    print("Debugging Browser Authentication...")
    print("=" * 60)
    
    # Test 1: Check if Django is responding to API calls
    print("\n1. Testing Django API responsiveness...")
    try:
        response = requests.get(f"{base_url}/auth/login/", timeout=5)
        print(f"   GET /auth/login/ - Status: {response.status_code}")
    except Exception as e:
        print(f"   [ERROR] Django API not responding: {e}")
        return
    
    # Test 2: Test actual login with correct format
    print("\n2. Testing login with correct format...")
    login_data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(
            f"{base_url}/auth/login/", 
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        print(f"   POST /auth/login/ - Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("   [SUCCESS] Login successful!")
            print(f"   Response structure:")
            print(f"   - user: {data.get('user', {}).get('username')}")
            print(f"   - tokens structure: {list(data.get('tokens', {}).keys())}")
            
            # Test 3: Test authenticated request
            print("\n3. Testing authenticated request...")
            access_token = data['tokens']['access']
            headers = {"Authorization": f"Bearer {access_token}"}
            
            users_response = requests.get(
                f"{base_url}/users/admin/users/", 
                headers=headers,
                timeout=10
            )
            print(f"   GET /users/admin/users/ - Status: {users_response.status_code}")
            
            if users_response.status_code == 200:
                users_data = users_response.json()
                print(f"   [SUCCESS] Authenticated request successful!")
                print(f"   Users count: {users_data.get('count', 0)}")
            else:
                print(f"   [ERROR] Authenticated request failed: {users_response.text}")
                
        else:
            print(f"   [ERROR] Login failed: {response.text}")
            
    except Exception as e:
        print(f"   [ERROR] Login request failed: {e}")
    
    # Test 4: Check if there's a CORS issue
    print("\n4. Checking CORS headers...")
    try:
        response = requests.options(f"{base_url}/auth/login/", timeout=5)
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        }
        print(f"   CORS headers: {cors_headers}")
    except Exception as e:
        print(f"   CORS check failed: {e}")
    
    print("\n" + "=" * 60)
    print("Browser Debug Steps:")
    print("1. Open Developer Tools (F12)")
    print("2. Go to Console tab")
    print("3. Try logging in and check for any red errors")
    print("4. Go to Network tab")
    print("5. Filter by 'XHR' or 'Fetch'")
    print("6. Try login and check the request/response")
    print("\nWhat to look for:")
    print("- Request URL should be: http://localhost:8000/api/auth/login/")
    print("- Request method should be: POST")
    print("- Response should have status 200")
    print("- Check for CORS errors in console")

if __name__ == "__main__":
    debug_browser_auth()