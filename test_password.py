#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings')
django.setup()

from django.contrib.auth.hashers import check_password
from users.models import User

def test_admin_password():
    try:
        admin = User.objects.get(username='admin')
        print(f'Admin user found: {admin.username}')
        print(f'Is active: {admin.is_active}')
        print(f'Is staff: {admin.is_staff}')
        print(f'Role: {admin.role}')
        print(f'Status: {admin.status}')
        print()
        
        # Test both possible passwords
        passwords_to_test = ['admin123', '12341234']
        
        for password in passwords_to_test:
            if check_password(password, admin.password):
                print(f'✓ SUCCESS: Password "{password}" is CORRECT!')
                return True
            else:
                print(f'✗ FAILED: Password "{password}" is incorrect')
        
        print()
        print('❌ Neither password worked!')
        print('The admin user exists but the password does not match either expected value.')
        return False
        
    except User.DoesNotExist:
        print('❌ Admin user does not exist in the database!')
        return False
    except Exception as e:
        print(f'❌ Error: {e}')
        return False

if __name__ == "__main__":
    test_admin_password()