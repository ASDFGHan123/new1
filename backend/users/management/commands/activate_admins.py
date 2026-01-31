from django.core.management.base import BaseCommand
from users.models import User


class Command(BaseCommand):
    help = 'Activate all admin users'

    def handle(self, *args, **options):
        admins = User.objects.filter(role='admin')
        count = admins.update(is_active=True)
        self.stdout.write(self.style.SUCCESS(f'Activated {count} admin users'))
