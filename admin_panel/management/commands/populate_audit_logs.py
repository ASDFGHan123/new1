"""
Management command to populate sample audit logs for testing.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from admin_panel.models import AuditLog
from datetime import timedelta
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Populate sample audit logs for testing'

    def handle(self, *args, **options):
        try:
            admin_user = User.objects.filter(is_superuser=True).first()
            if not admin_user:
                self.stdout.write(self.style.ERROR('No admin user found'))
                return

            # Create sample audit logs
            now = timezone.now()
            logs = [
                {
                    'action_type': AuditLog.ActionType.USER_LOGIN,
                    'description': 'Admin user logged in',
                    'actor': admin_user,
                    'target_type': AuditLog.TargetType.AUTH,
                    'severity': AuditLog.SeverityLevel.INFO,
                    'category': 'authentication',
                    'timestamp': now - timedelta(minutes=5)
                },
                {
                    'action_type': AuditLog.ActionType.SYSTEM_SETTINGS_CHANGED,
                    'description': 'System settings updated',
                    'actor': admin_user,
                    'target_type': AuditLog.TargetType.SYSTEM,
                    'severity': AuditLog.SeverityLevel.WARNING,
                    'category': 'system_settings',
                    'timestamp': now - timedelta(minutes=3)
                },
                {
                    'action_type': AuditLog.ActionType.USER_CREATED,
                    'description': 'New user created: testuser',
                    'actor': admin_user,
                    'target_type': AuditLog.TargetType.USER,
                    'target_id': 'user-123',
                    'severity': AuditLog.SeverityLevel.INFO,
                    'category': 'user_management',
                    'timestamp': now - timedelta(minutes=1)
                },
                {
                    'action_type': AuditLog.ActionType.BACKUP_CREATED,
                    'description': 'Full system backup created',
                    'actor': admin_user,
                    'target_type': AuditLog.TargetType.SYSTEM,
                    'severity': AuditLog.SeverityLevel.INFO,
                    'category': 'backup',
                    'timestamp': now
                },
            ]

            for log_data in logs:
                timestamp = log_data.pop('timestamp')
                AuditLog.objects.create(**log_data, timestamp=timestamp)

            self.stdout.write(self.style.SUCCESS(f'Successfully created {len(logs)} audit logs'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
