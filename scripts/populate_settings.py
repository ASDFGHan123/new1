import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from admin_panel.models import SystemSettings

settings_data = [
    ('app_name', 'OffChat', 'general', 'Application name'),
    ('app_version', '1.0.0', 'general', 'Application version'),
    ('max_users', '1000', 'general', 'Maximum users'),
    ('maintenance_mode', 'false', 'general', 'Maintenance mode'),
    ('enable_registration', 'true', 'general', 'Enable user registration'),
    
    ('jwt_expiry', '3600', 'security', 'JWT token expiry in seconds'),
    ('password_min_length', '8', 'security', 'Minimum password length'),
    ('require_email_verification', 'false', 'security', 'Require email verification'),
    ('enable_2fa', 'false', 'security', 'Enable two-factor authentication'),
    ('rate_limit_enabled', 'true', 'security', 'Enable rate limiting'),
    ('rate_limit_requests', '100', 'security', 'Rate limit requests per minute'),
    ('session_timeout', '1800', 'security', 'Session timeout in seconds'),
    ('max_login_attempts', '5', 'security', 'Maximum login attempts'),
    ('lockout_duration', '900', 'security', 'Account lockout duration in seconds'),
    
    ('max_message_length', '5000', 'chat', 'Maximum message length'),
    ('enable_file_sharing', 'true', 'chat', 'Enable file sharing'),
    ('max_file_size', '52428800', 'chat', 'Maximum file size in bytes'),
    ('enable_typing_indicator', 'true', 'chat', 'Enable typing indicator'),
    ('enable_read_receipts', 'true', 'chat', 'Enable read receipts'),
    ('message_retention_days', '90', 'chat', 'Message retention in days'),
    
    ('smtp_host', 'smtp.gmail.com', 'email', 'SMTP host'),
    ('smtp_port', '587', 'email', 'SMTP port'),
    ('smtp_user', '', 'email', 'SMTP username'),
    ('smtp_password', '', 'email', 'SMTP password'),
    ('email_from', 'noreply@offchat.com', 'email', 'From email address'),
    ('enable_email_notifications', 'true', 'email', 'Enable email notifications'),
    
    ('backup_enabled', 'true', 'backup', 'Enable automatic backups'),
    ('backup_frequency', 'daily', 'backup', 'Backup frequency'),
    ('backup_retention_days', '30', 'backup', 'Backup retention in days'),
    ('backup_location', '/backups', 'backup', 'Backup location'),
]

for key, value, category, description in settings_data:
    SystemSettings.objects.get_or_create(
        key=key,
        defaults={
            'value': value,
            'category': category,
            'description': description,
        }
    )

print(f'Created {len(settings_data)} settings')
