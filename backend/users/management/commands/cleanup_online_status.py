from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import User


class Command(BaseCommand):
    help = 'Mark users as offline if no heartbeat for 20 seconds'

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(seconds=20)
        updated = User.objects.filter(
            online_status__in=['online', 'away'],
            last_seen__lt=cutoff
        ).update(online_status='offline')
        self.stdout.write(
            self.style.SUCCESS(f'Marked {updated} users as offline (no heartbeat for 20+ seconds)')
        )
