import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from django.contrib.auth.models import Permission

# Delete MessageTemplate and SystemMessage permissions
perms = Permission.objects.filter(
    codename__in=['add_messagetemplate', 'change_messagetemplate', 'delete_messagetemplate', 'view_messagetemplate',
                  'add_systemmessage', 'change_systemmessage', 'delete_systemmessage', 'view_systemmessage']
)
count = perms.count()
perms.delete()
print(f"Deleted {count} permissions")
