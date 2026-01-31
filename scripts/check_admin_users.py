#!/usr/bin/env python
"""
Check admin users in the system
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat.settings')
django.setup()

from users.models import User

def check_admin_users():
    """Check all admin users"""
    print("🔍 Checking admin users...")
    
    try:
        # Superusers
        superusers = User.objects.filter(is_superuser=True)
        print(f"\n👑 Superusers ({superusers.count()}):")
        for user in superusers:
            print(f"   - {user.username} (email: {user.email}, active: {user.is_active})")
        
        # Staff users
        staff_users = User.objects.filter(is_staff=True, is_superuser=False)
        print(f"\n👨‍💼 Staff users ({staff_users.count()}):")
        for user in staff_users:
            print(f"   - {user.username} (email: {user.email}, active: {user.is_active})")
        
        # All users
        all_users = User.objects.all()
        print(f"\n👥 All users ({all_users.count()}):")
        for user in all_users:
            roles = []
            if user.is_superuser:
                roles.append("superuser")
            if user.is_staff:
                roles.append("staff")
            if user.is_active:
                roles.append("active")
            else:
                roles.append("inactive")
            print(f"   - {user.username} ({', '.join(roles)})")
        
        return True
        
    except Exception as e:
        print(f"❌ Error checking users: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    check_admin_users()
