from django.core.management.base import BaseCommand
from admin_panel.models import SystemSettings


class Command(BaseCommand):
    help = 'Create default system settings'

    def handle(self, *args, **options):
        settings_data = [
            # Security settings
            ('max_login_attempts', '5', 'security', 'Maximum login attempts before lockout'),
            ('session_timeout', '3600', 'security', 'Session timeout in seconds'),
            ('password_min_length', '8', 'security', 'Minimum password length'),
            
            # Backup settings
            ('backup_frequency', 'daily', 'backup', 'Backup frequency (hourly, daily, weekly, monthly)'),
            ('backup_retention_days', '30', 'backup', 'Number of days to retain backups'),
            ('auto_backup_enabled', 'true', 'backup', 'Enable automatic backups'),
            
            # Chat settings
            ('max_message_length', '5000', 'chat', 'Maximum message length in characters'),
            ('typing_indicator_enabled', 'true', 'chat', 'Enable typing indicators'),
            ('read_receipts_enabled', 'true', 'chat', 'Enable read receipts'),
            
            # Email settings
            ('email_notifications_enabled', 'true', 'email', 'Enable email notifications'),
            ('email_digest_frequency', 'daily', 'email', 'Email digest frequency'),
            
            # General settings
            ('app_name', 'OffChat', 'general', 'Application name'),
            ('app_version', '1.0.0', 'general', 'Application version'),
            ('maintenance_mode', 'false', 'general', 'Enable maintenance mode'),
        ]
        
        for key, value, category, description in settings_data:
            setting, created = SystemSettings.objects.get_or_create(
                key=key,
                defaults={
                    'value': value,
                    'category': category,
                    'description': description
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created setting: {key}'))
            else:
                self.stdout.write(self.style.WARNING(f'Setting already exists: {key}'))
        
        self.stdout.write(self.style.SUCCESS('Default system settings created successfully'))
