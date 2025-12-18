#!/usr/bin/env python
"""
Script to apply trash functionality migration.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

from django.core.management import call_command

print("Applying trash functionality migration...")

try:
    call_command('migrate', 'users', '0004_trash')
    print("✓ Trash migration applied successfully")
except Exception as e:
    print(f"✗ Error applying migration: {e}")
    sys.exit(1)

print("\nTrash functionality is now ready!")
print("- Users can be moved to trash instead of permanently deleted")
print("- Trash items expire after 30 days")
print("- Admins can restore or permanently delete items from trash")
