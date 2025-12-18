#!/usr/bin/env python
"""
Verification script for System Settings implementation.
Tests all components and reports status.
"""

import os
import sys
import django

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
django.setup()

from admin_panel.models import SystemSettings
from django.contrib.auth import get_user_model

User = get_user_model()

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

def print_success(text):
    print(f"[OK] {text}")

def print_error(text):
    print(f"[ERROR] {text}")

def print_info(text):
    print(f"[INFO] {text}")

def verify_model():
    """Verify SystemSettings model exists and is accessible."""
    print_header("1. Verifying SystemSettings Model")
    try:
        count = SystemSettings.objects.count()
        print_success(f"SystemSettings model accessible")
        print_info(f"Total settings in database: {count}")
        return True
    except Exception as e:
        print_error(f"Failed to access SystemSettings: {str(e)}")
        return False

def verify_default_settings():
    """Verify all default settings are created."""
    print_header("2. Verifying Default Settings")
    
    expected_settings = {
        'general': ['app_name', 'app_version', 'maintenance_mode', 'max_file_upload_size', 'session_timeout'],
        'security': ['password_min_length', 'password_require_uppercase', 'password_require_numbers', 
                    'password_require_special', 'max_login_attempts', 'lockout_duration', 
                    'enable_two_factor', 'rate_limit_enabled', 'rate_limit_requests'],
        'chat': ['max_message_length', 'max_group_members', 'message_retention_days',
                'enable_message_encryption', 'enable_typing_indicators', 'enable_read_receipts'],
        'email': ['email_notifications_enabled', 'email_from_address', 'email_from_name',
                 'smtp_host', 'smtp_port', 'smtp_use_tls'],
        'backup': ['auto_backup_enabled', 'backup_frequency', 'backup_retention_days', 'backup_location']
    }
    
    all_good = True
    for category, keys in expected_settings.items():
        print_info(f"\nCategory: {category.upper()}")
        for key in keys:
            try:
                setting = SystemSettings.objects.get(key=key)
                print_success(f"  {key} = {setting.value}")
            except SystemSettings.DoesNotExist:
                print_error(f"  {key} - NOT FOUND")
                all_good = False
    
    return all_good

def verify_categories():
    """Verify all categories are represented."""
    print_header("3. Verifying Categories")
    
    categories = SystemSettings.objects.values_list('category', flat=True).distinct()
    expected_categories = {'general', 'security', 'chat', 'email', 'backup'}
    found_categories = set(categories)
    
    print_info(f"Expected categories: {expected_categories}")
    print_info(f"Found categories: {found_categories}")
    
    if expected_categories == found_categories:
        print_success("All categories present")
        return True
    else:
        missing = expected_categories - found_categories
        if missing:
            print_error(f"Missing categories: {missing}")
        return False

def verify_settings_count():
    """Verify correct number of settings."""
    print_header("4. Verifying Settings Count")
    
    total = SystemSettings.objects.count()
    expected = 30
    
    print_info(f"Expected settings: {expected}")
    print_info(f"Found settings: {total}")
    
    if total == expected:
        print_success(f"Correct number of settings ({total})")
        return True
    else:
        print_error(f"Expected {expected} settings, found {total}")
        return False

def verify_settings_values():
    """Verify settings have proper values."""
    print_header("5. Verifying Settings Values")
    
    all_good = True
    settings = SystemSettings.objects.all()
    
    for setting in settings:
        if not setting.value:
            print_error(f"{setting.key} has empty value")
            all_good = False
        if not setting.description:
            print_error(f"{setting.key} has no description")
            all_good = False
    
    if all_good:
        print_success("All settings have values and descriptions")
    
    return all_good

def verify_api_endpoints():
    """Verify API endpoints are registered."""
    print_header("6. Verifying API Endpoints")
    
    from django.urls import reverse, NoReverseMatch
    
    endpoints = [
        ('admin_panel:system_settings_list', []),
        ('admin_panel:system_setting_detail', ['test_key']),
        ('admin_panel:system_setting_update', ['test_key']),
    ]
    
    all_good = True
    for endpoint_name, args in endpoints:
        try:
            url = reverse(endpoint_name, args=args)
            print_success(f"{endpoint_name}: {url}")
        except NoReverseMatch:
            print_error(f"{endpoint_name} - NOT FOUND")
            all_good = False
    
    return all_good

def verify_serializers():
    """Verify serializers are available."""
    print_header("7. Verifying Serializers")
    
    try:
        from admin_panel.serializers import SystemSettingSerializer, SystemSettingCreateUpdateSerializer
        print_success("SystemSettingSerializer imported")
        print_success("SystemSettingCreateUpdateSerializer imported")
        return True
    except ImportError as e:
        print_error(f"Failed to import serializers: {str(e)}")
        return False

def verify_views():
    """Verify views are available."""
    print_header("8. Verifying Views")
    
    try:
        from admin_panel.views import (
            SystemSettingsListView,
            SystemSettingDetailView,
            SystemSettingUpdateView,
            SystemSettingsBulkUpdateView
        )
        print_success("SystemSettingsListView imported")
        print_success("SystemSettingDetailView imported")
        print_success("SystemSettingUpdateView imported")
        print_success("SystemSettingsBulkUpdateView imported")
        return True
    except ImportError as e:
        print_error(f"Failed to import views: {str(e)}")
        return False

def verify_admin_user():
    """Verify admin user exists."""
    print_header("9. Verifying Admin User")
    
    admin = User.objects.filter(is_superuser=True).first()
    if admin:
        print_success(f"Admin user found: {admin.username}")
        return True
    else:
        print_error("No admin user found")
        return False

def generate_report(results):
    """Generate final report."""
    print_header("VERIFICATION REPORT")
    
    total = len(results)
    passed = sum(1 for r in results.values() if r)
    failed = total - passed
    
    print_info(f"Total checks: {total}")
    print_info(f"Passed: {passed}")
    print_info(f"Failed: {failed}")
    
    if failed == 0:
        print_success("\nALL CHECKS PASSED - System Settings Ready!")
        return True
    else:
        print_error(f"\n{failed} check(s) failed - Please review above")
        return False

def main():
    """Run all verification checks."""
    print("\n" + "="*60)
    print("  SYSTEM SETTINGS VERIFICATION")
    print("="*60)
    
    results = {
        'Model': verify_model(),
        'Default Settings': verify_default_settings(),
        'Categories': verify_categories(),
        'Settings Count': verify_settings_count(),
        'Settings Values': verify_settings_values(),
        'API Endpoints': verify_api_endpoints(),
        'Serializers': verify_serializers(),
        'Views': verify_views(),
        'Admin User': verify_admin_user(),
    }
    
    success = generate_report(results)
    
    print("\n" + "="*60)
    print("  NEXT STEPS")
    print("="*60)
    print("1. Start Django server: python manage.py runserver")
    print("2. Start React frontend: npm run dev")
    print("3. Navigate to http://localhost:5173")
    print("4. Login and go to Settings tab")
    print("5. Test modifying and saving settings")
    print("="*60 + "\n")
    
    return 0 if success else 1

if __name__ == '__main__':
    sys.exit(main())
