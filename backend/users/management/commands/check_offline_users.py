"""
Management command to check and mark inactive users as offline.
"""
from django.core.management.base import BaseCommand
from users.services.offline_tracker import mark_inactive_users_offline


class Command(BaseCommand):
    help = 'Check and mark inactive users as offline'

    def handle(self, *args, **options):
        count = mark_inactive_users_offline()
        self.stdout.write(
            self.style.SUCCESS(f'Successfully marked {count} users as offline')
        )
