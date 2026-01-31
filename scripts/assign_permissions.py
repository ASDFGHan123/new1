import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings')
django.setup()

from django.contrib.auth.models import Permission, User
from users.models import User as CustomUser

# Get the moderator user
moderator = CustomUser.objects.get(username='ahmad9')

# Clear existing permissions
moderator.user_permissions.clear()

# Assign view_user permission
try:
    view_user_perm = Permission.objects.get(codename='view_user')
    moderator.user_permissions.add(view_user_perm)
    print(f"Added view_user permission to {moderator.username}")
except Permission.DoesNotExist:
    print("view_user permission not found")

# Assign view_logentry permission
try:
    view_log_perm = Permission.objects.get(codename='view_logentry')
    moderator.user_permissions.add(view_log_perm)
    print(f"Added view_logentry permission to {moderator.username}")
except Permission.DoesNotExist:
    print("view_logentry permission not found")

# Check assigned permissions
print(f"\nPermissions for {moderator.username}:")
for perm in moderator.user_permissions.all():
    print(f"  - {perm.codename}: {perm.name}")

print("\nDone!")
