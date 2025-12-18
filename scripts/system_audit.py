#!/usr/bin/env python3
"""
Comprehensive system audit to identify API endpoint issues and database integration problems
"""

import requests
import json
import os
import re

def get_auth_token():
    """Get authentication token"""
    try:
        response = requests.post("http://localhost:8000/api/auth/login/", 
                               json={"username": "admin", "password": "12341234"})
        if response.status_code == 200:
            return response.json()['tokens']['access']
    except:
        pass
    return None

def test_all_endpoints():
    """Test all API endpoints used by frontend"""
    token = get_auth_token()
    if not token:
        print("[ERROR] Cannot get auth token")
        return {}
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # All endpoints used by frontend
    endpoints = {
        # Auth endpoints
        "/api/auth/login/": "POST",
        "/api/auth/logout/": "POST", 
        "/api/auth/profile/": "GET",
        "/api/auth/verify/": "POST",
        
        # User management
        "/api/users/admin/users/": "GET",
        
        # Analytics
        "/api/analytics/dashboard/stats/": "GET",
        "/api/analytics/data/": "GET",
        "/api/analytics/audit-logs/": "GET",
        
        # Admin endpoints
        "/api/admin/dashboard/stats/": "GET",
        "/api/admin/analytics/": "GET",  # This was broken
        "/api/admin/audit-logs/": "GET",
        "/api/admin/message-templates/": "GET",
        
        # Chat endpoints
        "/api/chat/conversations/": "GET",
    }
    
    results = {}
    for endpoint, method in endpoints.items():
        try:
            if method == "GET":
                response = requests.get(f"http://localhost:8000{endpoint}", headers=headers)
            else:
                response = requests.post(f"http://localhost:8000{endpoint}", headers=headers)
            
            results[endpoint] = {
                "status": response.status_code,
                "working": response.status_code < 400,
                "error": None if response.status_code < 400 else response.text[:200]
            }
        except Exception as e:
            results[endpoint] = {
                "status": "ERROR",
                "working": False,
                "error": str(e)
            }
    
    return results

def analyze_frontend_api_calls():
    """Analyze frontend code for API calls"""
    api_calls = []
    
    # Check api.ts file
    try:
        with open("src/lib/api.ts", "r", encoding="utf-8") as f:
            content = f.read()
            
        # Find all API endpoint calls
        patterns = [
            r"this\.request\(['\"]([^'\"]+)['\"]",
            r"fetch\(['\"]([^'\"]+)['\"]",
            r"baseURL\s*\+\s*['\"]([^'\"]+)['\"]"
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, content)
            api_calls.extend(matches)
    except:
        pass
    
    return list(set(api_calls))

def check_database_integration():
    """Check which components should use database data"""
    components_needing_db = {
        "UserManagement": {
            "file": "src/components/admin/UserManagement.tsx",
            "endpoints": ["/api/users/admin/users/"],
            "data_source": "users app models"
        },
        "MessageAnalytics": {
            "file": "src/components/admin/MessageAnalytics.tsx", 
            "endpoints": ["/api/analytics/data/"],
            "data_source": "analytics app + users data"
        },
        "DashboardStats": {
            "file": "src/components/admin/DashboardStats.tsx",
            "endpoints": ["/api/analytics/dashboard/stats/"],
            "data_source": "calculated from users + activities"
        },
        "AuditLogs": {
            "file": "src/components/admin/AuditLogs.tsx",
            "endpoints": ["/api/analytics/audit-logs/"],
            "data_source": "UserActivity model"
        },
        "MessageTemplates": {
            "file": "src/components/admin/MessageTemplates.tsx",
            "endpoints": ["/api/admin/message-templates/"],
            "data_source": "admin_panel app models"
        }
    }
    
    return components_needing_db

if __name__ == "__main__":
    print("=== COMPREHENSIVE SYSTEM AUDIT ===")
    
    print("\n1. Testing all API endpoints...")
    endpoint_results = test_all_endpoints()
    
    working_endpoints = [ep for ep, result in endpoint_results.items() if result["working"]]
    broken_endpoints = [ep for ep, result in endpoint_results.items() if not result["working"]]
    
    print(f"[OK] Working endpoints: {len(working_endpoints)}")
    print(f"[ERROR] Broken endpoints: {len(broken_endpoints)}")
    
    if broken_endpoints:
        print("\nBroken endpoints:")
        for ep in broken_endpoints:
            result = endpoint_results[ep]
            print(f"  - {ep}: {result['status']} - {result['error'][:100] if result['error'] else 'Unknown error'}")
    
    print("\n2. Analyzing frontend API calls...")
    api_calls = analyze_frontend_api_calls()
    print(f"Found {len(api_calls)} unique API calls in frontend")
    
    print("\n3. Components requiring database integration:")
    components = check_database_integration()
    for name, info in components.items():
        print(f"  - {name}: {info['endpoints']} -> {info['data_source']}")
    
    print(f"\n=== AUDIT COMPLETE ===")
    print(f"Total endpoints tested: {len(endpoint_results)}")
    print(f"Working: {len(working_endpoints)}")
    print(f"Broken: {len(broken_endpoints)}")