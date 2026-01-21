#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from users.models import User
from users.views import IsAdminUser
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request

# Get Ahmad
ahmad = User.objects.get(username='ahmad')

# Create a mock request
factory = APIRequestFactory()
django_request = factory.get('/')
django_request.user = ahmad

# Create DRF request
request = Request(django_request)

# Debug info
print(f"\nDEBUG:")
print(f"request.user: {request.user}")
print(f"request.user.is_authenticated: {request.user.is_authenticated}")
print(f"request.user.role: {getattr(request.user, 'role', 'NOT FOUND')}")
print(f"request.user.is_staff: {getattr(request.user, 'is_staff', 'NOT FOUND')}")

# Test the permission
permission = IsAdminUser()
has_permission = permission.has_permission(request, None)

print(f"\n{'='*50}")
print(f"User: {ahmad.username}")
print(f"Role: {ahmad.role}")
print(f"Is Staff: {ahmad.is_staff}")
print(f"Is Superuser: {ahmad.is_superuser}")
print(f"{'='*50}")
print(f"\nIsAdminUser Permission Check: {has_permission}")
print(f"Ahmad CAN delete users: {has_permission}\n")
