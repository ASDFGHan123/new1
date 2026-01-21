#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models import User

try:
    ahmad = User.objects.get(username='ahmad')
    print(f"\n{'='*50}")
    print(f"User: {ahmad.username}")
    print(f"Email: {ahmad.email}")
    print(f"Role: {ahmad.role}")
    print(f"Status: {ahmad.status}")
    print(f"Is Staff: {ahmad.is_staff}")
    print(f"Is Superuser: {ahmad.is_superuser}")
    print(f"Is Active: {ahmad.is_active}")
    print(f"{'='*50}")
    
    is_admin = ahmad.role == 'admin' or ahmad.is_staff or ahmad.is_superuser
    print(f"\n✓ Ahmad IS an admin: {is_admin}\n")
    
except User.DoesNotExist:
    print("\n✗ User 'ahmad' not found in database\n")
except Exception as e:
    print(f"\n✗ Error: {str(e)}\n")
