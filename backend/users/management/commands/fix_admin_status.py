"""
Management command to fix admin user status and online status.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Fix admin and staff user status to be active and online'

    def handle(self, *args, **options):
        # Fix all superusers and staff members
        admin_users = User.objects.filter(is_superuser=True) | User.objects.filter(is_staff=True)
        
        updated_count = 0
        for user in admin_users:
            updated = False
            
            if not user.is_active:
                user.is_active = True
                updated = True
            
            if user.status != 'active':
                user.status = 'active'
                updated = True
            
            if user.online_status != 'online':
                user.online_status = 'online'
                updated = True
            
            if updated:
                user.save(update_fields=['is_active', 'status', 'online_status'])
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Fixed user: {user.username}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'\nTotal users fixed: {updated_count}')
        )
