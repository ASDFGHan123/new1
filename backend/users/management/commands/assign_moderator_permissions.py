from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from users.models import User

class Command(BaseCommand):
    help = 'Assign permissions to moderator users'

    def handle(self, *args, **options):
        # Get the moderator user
        try:
            moderator = User.objects.get(username='ahmad9')
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR('Moderator user ahmad9 not found'))
            return

        # Clear existing permissions
        moderator.user_permissions.clear()

        # Assign view_user permission
        try:
            view_user_perm = Permission.objects.get(codename='view_user')
            moderator.user_permissions.add(view_user_perm)
            self.stdout.write(self.style.SUCCESS(f"Added view_user permission to {moderator.username}"))
        except Permission.DoesNotExist:
            self.stdout.write(self.style.ERROR("view_user permission not found"))

        # Assign view_logentry permission
        try:
            view_log_perm = Permission.objects.get(codename='view_logentry')
            moderator.user_permissions.add(view_log_perm)
            self.stdout.write(self.style.SUCCESS(f"Added view_logentry permission to {moderator.username}"))
        except Permission.DoesNotExist:
            self.stdout.write(self.style.ERROR("view_logentry permission not found"))

        # Check assigned permissions
        self.stdout.write(f"\nPermissions for {moderator.username}:")
        for perm in moderator.user_permissions.all():
            self.stdout.write(f"  - {perm.codename}: {perm.name}")

        self.stdout.write(self.style.SUCCESS("\nDone!"))
