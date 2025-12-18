#!/usr/bin/env python3
"""
Network Access Verification Script for OffChat Project
This script tests if your project is accessible from other devices on the network.
"""

import socket
import requests
import time
import sys
from urllib.parse import urljoin

class NetworkAccessChecker:
    def __init__(self):
        self.local_ip = self.get_local_ip()
        self.ports = [5173, 8000]
        self.base_urls = [
            f"http://{self.local_ip}:5173",
            f"http://{self.local_ip}:8000",
            "http://localhost:5173",
            "http://localhost:8000"
        ]
        
    def get_local_ip(self):
        """Get the local IP address"""
        try:
            # Connect to a remote address to determine local IP
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            return local_ip
        except Exception:
            return "192.168.2.9"  # Fallback IP
    
    def check_port_open(self, host, port):
        """Check if a port is open"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1)
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except Exception:
            return False
    
    def check_http_response(self, url):
        """Check if HTTP endpoint responds"""
        try:
            response = requests.get(url, timeout=5)
            return response.status_code
        except Exception as e:
            return f"Error: {str(e)}"
    
    def run_tests(self):
        """Run all network access tests"""
        print("=" * 60)
        print("OffChat Project - Network Access Verification")
        print("=" * 60)
        print(f"Detected Local IP: {self.local_ip}")
        print(f"Target IP: 192.168.2.9")
        print()
        
        # Test 1: Port Availability
        print("[TEST 1] Checking Port Availability")
        print("-" * 40)
        for port in self.ports:
            local_open = self.check_port_open('127.0.0.1', port)
            network_open = self.check_port_open(self.local_ip, port)
            
            print(f"Port {port}:")
            print(f"  Local (127.0.0.1): {'✓ OPEN' if local_open else '✗ CLOSED'}")
            print(f"  Network ({self.local_ip}): {'✓ OPEN' if network_open else '✗ CLOSED'}")
            print()
        
        # Test 2: HTTP Endpoints
        print("[TEST 2] Testing HTTP Endpoints")
        print("-" * 40)
        test_urls = [
            (f"http://{self.local_ip}:8000", "Django Backend"),
            (f"http://{self.local_ip}:8000/admin", "Django Admin"),
            (f"http://{self.local_ip}:8000/api/", "API Root"),
            (f"http://{self.local_ip}:5173", "React Frontend")
        ]
        
        for url, description in test_urls:
            status = self.check_http_response(url)
            if isinstance(status, int):
                status_text = f"HTTP {status}"
                status_color = "✓" if status < 400 else "⚠"
            else:
                status_text = status
                status_color = "✗"
            
            print(f"{status_color} {description}: {status_text}")
            print(f"   URL: {url}")
            print()
        
        # Test 3: CORS Configuration
        print("[TEST 3] Testing CORS Configuration")
        print("-" * 40)
        cors_test_url = f"http://{self.local_ip}:8000/api/auth/test/"
        
        try:
            # Test CORS preflight
            response = requests.options(
                f"http://{self.local_ip}:8000/api/auth/login/",
                headers={
                    'Origin': f'http://{self.local_ip}:5173',
                    'Access-Control-Request-Method': 'POST',
                    'Access-Control-Request-Headers': 'Content-Type'
                },
                timeout=5
            )
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            print("CORS Preflight Response:")
            for header, value in cors_headers.items():
                if value:
                    print(f"  ✓ {header}: {value}")
                else:
                    print(f"  ✗ {header}: Missing")
                    
        except Exception as e:
            print(f"✗ CORS test failed: {e}")
        
        print()
        print("=" * 60)
        print("NETWORK ACCESS SUMMARY")
        print("=" * 60)
        
        # Summary
        if self.local_ip == "192.168.2.9":
            print("✓ Your IP matches the expected network IP")
        else:
            print(f"⚠ Your IP ({self.local_ip}) doesn't match 192.168.2.9")
            print("  Update settings.py ALLOWED_HOSTS with your actual IP")
        
        # Instructions for external devices
        print("\nFOR OTHER DEVICES TO ACCESS:")
        print(f"1. Open browser and go to: http://{self.local_ip}:5173")
        print(f"2. Or directly to Django Admin: http://{self.local_ip}:8000/admin")
        print(f"3. Login credentials: admin / 12341234")
        
        # Troubleshooting
        print("\nTROUBLESHOOTING:")
        print("- If ports are closed, make sure servers are running")
        print("- Check Windows Firewall settings")
        print("- Verify all devices are on the same network")
        print("- Ensure Django ALLOWED_HOSTS includes your IP")

if __name__ == "__main__":
    checker = NetworkAccessChecker()
    checker.run_tests()