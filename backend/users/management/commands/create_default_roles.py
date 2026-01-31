from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from users.models import User


class Command(BaseCommand):
    help = 'Create default roles with permissions'

    def handle(self, *args, **options):
        # Define permissions
        permissions_data = [
            ('view_users', 'View user list', 'users'),
            ('create_users', 'Create new users', 'users'),
            ('edit_users', 'Edit user information', 'users'),
            ('delete_users', 'Delete users', 'users'),
            ('view_messages', 'View messages', 'chat'),
            ('moderate_messages', 'Moderate messages', 'chat'),
            ('view_analytics', 'View analytics', 'analytics'),
            ('manage_settings', 'Manage system settings', 'admin_panel'),
        ]

        # Create or get permissions
        perms = {}
        user_content_type = ContentType.objects.get_for_model(User)
        
        for codename, name, app in permissions_data:
            perm, created = Permission.objects.get_or_create(
                codename=codename,
                content_type=user_content_type,
                defaults={'name': name}
            )
            perms[codename] = perm
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created permission: {codename}'))

        # Create roles with permissions
        roles_data = [
            ('User', ['view_users', 'view_messages', 'view_analytics']),
            ('Moderator', ['view_users', 'view_messages', 'moderate_messages', 'view_analytics']),
            ('Admin', ['view_users', 'create_users', 'edit_users', 'delete_users', 'view_messages', 'moderate_messages', 'view_analytics', 'manage_settings']),
        ]

        for role_name, perm_codenames in roles_data:
            group, created = Group.objects.get_or_create(name=role_name)
            
            # Add permissions to group
            for codename in perm_codenames:
                if codename in perms:
                    group.permissions.add(perms[codename])
            
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created role: {role_name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Role already exists: {role_name}'))

        self.stdout.write(self.style.SUCCESS('Default roles and permissions created successfully'))
