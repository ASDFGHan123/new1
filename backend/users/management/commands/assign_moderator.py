"""
Django management command to assign moderator roles.
Usage: python manage.py assign_moderator <username> <role_type>
Example: python manage.py assign_moderator john_doe junior
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth import get_user_model
from users.moderator_models import ModeratorPermissionHelper

User = get_user_model()


class Command(BaseCommand):
    help = 'Assign moderator role to a user'
    
    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username of the user')
        parser.add_argument(
            'role_type',
            type=str,
            choices=['junior', 'senior', 'lead'],
            help='Moderator role type'
        )
    
    def handle(self, *args, **options):
        username = options['username']
        role_type = options['role_type']
        
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f'User "{username}" does not exist')
        
        try:
            profile = ModeratorPermissionHelper.assign_moderator_role(user, role_type)
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Successfully assigned {role_type} moderator role to {username}'
                )
            )
            self.stdout.write(f'  Role: {profile.role.name}')
            self.stdout.write(f'  Permissions: {", ".join(profile.get_permissions())}')
        except Exception as e:
            raise CommandError(f'Error assigning role: {str(e)}')
