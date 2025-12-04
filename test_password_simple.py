#!/usr/bin/env python3
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings')
django.setup()

from django.contrib.auth.hashers import check_password
from users.models import User

try:
    admin = User.objects.get(username='admin')
    print('Admin user found:', admin.username)
    print('Is active:', admin.is_active)
    print('Is staff:', admin.is_staff)
    print('Role:', admin.role)
    print('Status:', admin.status)
    print()
    
    # Test both possible passwords
    passwords_to_test = ['admin123', '12341234']
    
    for password in passwords_to_test:
        if check_password(password, admin.password):
            print(f'SUCCESS: Password "{password}" is CORRECT!')
            break
        else:
            print(f'FAILED: Password "{password}" is incorrect')
    
    else:
        print()
        print('Neither password worked!')
        print('The admin user exists but the password does not match either expected value.')
        
except User.DoesNotExist:
    print('Admin user does not exist in the database!')
except Exception as e:
    print(f'Error: {e}')