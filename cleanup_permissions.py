import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.contrib.auth.models import Permission, Group
from django.contrib.contenttypes.models import ContentType
from users.models import User

# Delete old roles
Group.objects.filter(name__in=['User', 'Moderator', 'Admin']).delete()
print("Old roles deleted")

# Delete all permissions for User model
user_ct = ContentType.objects.get_for_model(User)
Permission.objects.filter(content_type=user_ct).delete()
print("Old permissions deleted")

# Now recreate with correct permissions
from users.management.commands.create_default_roles import Command
cmd = Command()
cmd.handle()
