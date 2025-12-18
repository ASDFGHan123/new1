#!/usr/bin/env python3
"""
Debug script to test login authentication step by step
"""

import requests
import json

def test_login():
    url = "http://localhost:8000/api/auth/login/"
    data = {
        "username": "admin",
        "password": "12341234"
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"Testing login with:")
    print(f"URL: {url}")
    print(f"Data: {data}")
    print(f"Headers: {headers}")
    print()
    
    try:
        # Test with JSON string
        response = requests.post(url, json=data, headers=headers)
        print(f"Response Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            response_data = response.json()
            print(f"Parsed Response: {response_data}")
            if 'tokens' in response_data:
                print("SUCCESS: Got access tokens!")
                return response_data['tokens']['access']
            else:
                print("WARNING: No tokens in response")
        
    except Exception as e:
        print(f"ERROR: {e}")
        return None

def test_with_direct_json():
    url = "http://localhost:8000/api/auth/login/"
    json_string = '{"username": "admin", "password": "12341234"}'
    
    headers = {
        "Content-Type": "application/json"
    }
    
    print(f"\nTesting with direct JSON string:")
    print(f"JSON: {json_string}")
    
    try:
        response = requests.post(url, data=json_string, headers=headers)
        print(f"Response Status: {response.status_code}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: Login worked with direct JSON!")
            return True
        
    except Exception as e:
        print(f"ERROR: {e}")
        return False

if __name__ == "__main__":
    print("=== LOGIN DEBUG SCRIPT ===")
    access_token = test_login()
    test_with_direct_json()
    
    if access_token:
        print(f"\nAccess token obtained: {access_token[:20]}...")
    else:
        print("\nFailed to obtain access token")