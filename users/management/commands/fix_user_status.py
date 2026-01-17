"""
Management command to fix user online status.
"""
from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Fix user online status'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to fix')
        parser.add_argument('--status', type=str, choices=['online', 'away', 'offline'], 
                          default='offline', help='Set online status')

    def handle(self, *args, **options):
        username = options['username']
        status = options['status']
        
        try:
            user = User.objects.get(username=username)
            old_status = user.online_status
            user.online_status = status
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Updated {username}: {old_status} → {status}'
                )
            )
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} not found'))
