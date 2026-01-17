"""
Management command to check and fix user status issues.
"""
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Check and fix user status issues'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to check')
        parser.add_argument('--fix', action='store_true', help='Fix the user status')
        parser.add_argument('--is-active', type=bool, help='Set is_active value')
        parser.add_argument('--status', type=str, help='Set status value')

    def handle(self, *args, **options):
        username = options['username']
        
        try:
            user = User.objects.get(username=username)
            self.stdout.write(f"\nUser: {user.username}")
            self.stdout.write(f"  is_active: {user.is_active}")
            self.stdout.write(f"  status: {user.status}")
            self.stdout.write(f"  online_status: {user.online_status}")
            self.stdout.write(f"  Account Active: {user.is_active and user.status == 'active'}")
            
            if options['fix']:
                if options['is_active'] is not None:
                    user.is_active = options['is_active']
                    self.stdout.write(f"  Updated is_active to: {user.is_active}")
                
                if options['status']:
                    user.status = options['status']
                    self.stdout.write(f"  Updated status to: {user.status}")
                
                user.save()
                self.stdout.write(self.style.SUCCESS(f"\n✓ User {username} updated successfully"))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"User {username} not found"))
