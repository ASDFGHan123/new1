#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings')
django.setup()

from users.models import User

def create_admin():
    try:
        # Delete existing admin if any
        admin = User.objects.get(username='admin')
        admin.delete()
        print("Deleted existing admin user")
    except User.DoesNotExist:
        print("No existing admin user found")

    # Create fresh superuser
    admin = User.objects.create_superuser(
        username='admin', 
        email='admin@example.com', 
        password='admin123'
    )
    admin.role = 'admin'
    admin.status = 'active'
    admin.is_staff = True
    admin.is_superuser = True
    admin.save()

    print(f"Created admin user: {admin.username}")
    print(f"Email: {admin.email}")
    print(f"Password: admin123")
    print(f"Role: {admin.role}")
    print(f"Status: {admin.status}")
    print(f"Is staff: {admin.is_staff}")
    print(f"Is superuser: {admin.is_superuser}")
    
    return admin

if __name__ == "__main__":
    create_admin()