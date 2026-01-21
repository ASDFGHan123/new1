#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models import User
from users.services.user_management_service import UserManagementService

# Create a test user
test_user = User.objects.create_user(
    username='testuser123',
    email='testuser123@offchat.local',
    password='testpass123',
    role='user',
    status='active'
)

print(f"\n{'='*60}")
print(f"BEFORE role change:")
print(f"Username: {test_user.username}")
print(f"Role: {test_user.role}")
print(f"Is Staff: {test_user.is_staff}")
print(f"{'='*60}")

# Change role to admin
result = UserManagementService.change_user_role(test_user.id, 'admin')

# Refresh from database
test_user.refresh_from_db()

print(f"\nAFTER role change to 'admin':")
print(f"Username: {test_user.username}")
print(f"Role: {test_user.role}")
print(f"Is Staff: {test_user.is_staff}")
print(f"Result: {result}")
print(f"{'='*60}\n")

# Test changing back to user
result2 = UserManagementService.change_user_role(test_user.id, 'user')
test_user.refresh_from_db()

print(f"AFTER role change back to 'user':")
print(f"Username: {test_user.username}")
print(f"Role: {test_user.role}")
print(f"Is Staff: {test_user.is_staff}")
print(f"Result: {result2}")
print(f"{'='*60}\n")

# Cleanup
test_user.delete()
print("Test user deleted.")
