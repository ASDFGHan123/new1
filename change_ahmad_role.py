#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models import User
from users.services.user_management_service import UserManagementService

# Get Ahmad
ahmad = User.objects.get(username='ahmad')

print(f"\n{'='*60}")
print(f"BEFORE:")
print(f"Username: {ahmad.username}")
print(f"Role: {ahmad.role}")
print(f"Is Staff: {ahmad.is_staff}")
print(f"Is Superuser: {ahmad.is_superuser}")
print(f"{'='*60}\n")

# Change role to admin using the service
result = UserManagementService.change_user_role(ahmad.id, 'admin')

# Refresh from database
ahmad.refresh_from_db()

print(f"AFTER (using API):")
print(f"Username: {ahmad.username}")
print(f"Role: {ahmad.role}")
print(f"Is Staff: {ahmad.is_staff}")
print(f"Is Superuser: {ahmad.is_superuser}")
print(f"\nResult: {result}")
print(f"{'='*60}\n")
