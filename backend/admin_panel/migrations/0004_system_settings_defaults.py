from django.db import migrations

def create_default_settings(apps, schema_editor):
    SystemSettings = apps.get_model('admin_panel', 'SystemSettings')
    User = apps.get_model('users', 'User')
    
    admin_user = User.objects.filter(is_superuser=True).first()
    
    default_settings = [
        # General Settings
        ('app_name', 'OffChat', 'general', 'Application name'),
        ('app_version', '1.0.0', 'general', 'Application version'),
        ('maintenance_mode', 'false', 'general', 'Enable maintenance mode'),
        ('max_file_upload_size', '52428800', 'general', 'Max file upload size in bytes (50MB)'),
        ('session_timeout', '3600', 'general', 'Session timeout in seconds'),
        
        # Security Settings
        ('password_min_length', '8', 'security', 'Minimum password length'),
        ('password_require_uppercase', 'true', 'security', 'Require uppercase in password'),
        ('password_require_numbers', 'true', 'security', 'Require numbers in password'),
        ('password_require_special', 'true', 'security', 'Require special characters in password'),
        ('max_login_attempts', '5', 'security', 'Maximum login attempts before lockout'),
        ('lockout_duration', '900', 'security', 'Account lockout duration in seconds'),
        ('enable_two_factor', 'false', 'security', 'Enable two-factor authentication'),
        ('rate_limit_enabled', 'true', 'security', 'Enable rate limiting'),
        ('rate_limit_requests', '100', 'security', 'Rate limit requests per minute'),
        
        # Chat Settings
        ('max_message_length', '5000', 'chat', 'Maximum message length in characters'),
        ('max_group_members', '500', 'chat', 'Maximum members per group'),
        ('message_retention_days', '90', 'chat', 'Message retention period in days'),
        ('enable_message_encryption', 'true', 'chat', 'Enable end-to-end message encryption'),
        ('enable_typing_indicators', 'true', 'chat', 'Enable typing indicators'),
        ('enable_read_receipts', 'true', 'chat', 'Enable read receipts'),
        
        # Email Settings
        ('email_notifications_enabled', 'true', 'email', 'Enable email notifications'),
        ('email_from_address', 'noreply@offchat.com', 'email', 'Email from address'),
        ('email_from_name', 'OffChat', 'email', 'Email from name'),
        ('smtp_host', 'smtp.gmail.com', 'email', 'SMTP host'),
        ('smtp_port', '587', 'email', 'SMTP port'),
        ('smtp_use_tls', 'true', 'email', 'Use TLS for SMTP'),
        
        # Backup Settings
        ('auto_backup_enabled', 'true', 'backup', 'Enable automatic backups'),
        ('backup_frequency', 'daily', 'backup', 'Backup frequency (daily, weekly, monthly)'),
        ('backup_retention_days', '30', 'backup', 'Backup retention period in days'),
        ('backup_location', '/backups', 'backup', 'Backup storage location'),
    ]
    
    for key, value, category, description in default_settings:
        SystemSettings.objects.get_or_create(
            key=key,
            defaults={
                'value': value,
                'category': category,
                'description': description,
                'is_public': False,
                'updated_by': admin_user
            }
        )

def reverse_default_settings(apps, schema_editor):
    SystemSettings = apps.get_model('admin_panel', 'SystemSettings')
    SystemSettings.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        ('admin_panel', '0003_messagetemplate'),
    ]

    operations = [
        migrations.RunPython(create_default_settings, reverse_default_settings),
    ]
