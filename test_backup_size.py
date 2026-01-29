#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_admin.settings')
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
django.setup()

from admin_panel.services.backup_restore_service import BackupRestoreService
from admin_panel.models import Backup

def test_backup_creation():
    print("=== Testing Backup Creation ===")
    
    try:
        # Create a users backup (smaller and faster)
        print("Creating users backup...")
        result = BackupRestoreService.create_backup(
            backup_type='users',
            name='Test_Size_Check_Backup',
            description='Testing backup size calculation'
        )
        
        backup_id = result['backup_id']
        print(f"Backup created with ID: {backup_id}")
        
        # Check the backup
        backup = Backup.objects.get(id=backup_id)
        print(f"Backup status: {backup.status}")
        print(f"Backup file_size: {backup.file_size}")
        print(f"Backup record_count: {backup.record_count}")
        
        if backup.file:
            print(f"Backup file path: {backup.file.path}")
            if os.path.exists(backup.file.path):
                actual_size = os.path.getsize(backup.file.path)
                print(f"Actual file size: {actual_size} bytes")
                print(f"Actual file size: {actual_size / (1024*1024):.2f} MB")
            else:
                print("File does not exist on disk")
        else:
            print("No file associated with backup")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_backup_creation()
