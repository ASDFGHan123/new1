#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models import User
from users.services.user_management_service import UserManagementService

# Get a test user (not admin)
test_user = User.objects.filter(role='user').first()

if test_user:
    print(f"\n{'='*60}")
    print(f"BEFORE update_user:")
    print(f"Username: {test_user.username}")
    print(f"Role: {test_user.role}")
    print(f"Is Staff: {test_user.is_staff}")
    print(f"{'='*60}\n")

    # Update user role to admin using update_user
    result = UserManagementService.update_user(test_user.id, {'role': 'admin'})

    # Refresh from database
    test_user.refresh_from_db()

    print(f"AFTER update_user with role='admin':")
    print(f"Username: {test_user.username}")
    print(f"Role: {test_user.role}")
    print(f"Is Staff: {test_user.is_staff}")
    print(f"Result: {result}")
    print(f"{'='*60}\n")
else:
    print("No test user found")
