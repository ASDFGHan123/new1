#!/usr/bin/env python3
"""
Simple database check for OffChat system
"""

import os
import sys
import django
from django.db import connection

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models import User

def main():
    print("=== SIMPLE DATABASE CHECK ===")
    
    # Check tables
    with connection.cursor() as cursor:
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
    
    print(f"Total tables: {len(tables)}")
    print("Tables:", ", ".join(sorted(tables)))
    
    # Check users
    users = User.objects.all()
    print(f"\nUsers: {users.count()}")
    
    if users.exists():
        admin_users = users.filter(role='admin')
        print(f"Admin users: {admin_users.count()}")
        
        for user in admin_users:
            print(f"  - {user.username} ({user.email})")
    
    print("\nDatabase check complete")

if __name__ == "__main__":
    main()