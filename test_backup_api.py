#!/usr/bin/env python
"""
Test backup API endpoints
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat.settings')
django.setup()

from admin_panel.services.backup_restore_service import BackupRestoreService
from users.models import User
from admin_panel.models import Backup

def test_backup_creation():
    """Test backup creation through service"""
    print("Testing backup creation...")
    
    try:
        # Get admin user
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            print("❌ No admin user found")
            return False
        
        print(f"✅ Found admin user: {admin_user.username}")
        
        # Test users backup (simpler than full backup)
        print("Creating users backup...")
        result = BackupRestoreService.create_backup(
            backup_type='users',
            name='Test_Users_Backup_API',
            description='Test users backup for API verification',
            admin_user=admin_user
        )
        
        print(f"✅ Backup creation started: {result}")
        backup_id = result['backup_id']
        
        # Wait a bit and check status
        import time
        time.sleep(3)
        
        status = BackupRestoreService.get_backup_status(backup_id)
        print(f"Backup status: {status}")
        
        # Check if backup exists in database
        backup = Backup.objects.get(id=backup_id)
        print(f"Backup in DB: {backup.name} - Status: {backup.status} - File: {backup.file}")
        
        if backup.file:
            print(f"File path: {backup.file.path}")
            print(f"File size: {backup.file.size if hasattr(backup.file, 'size') else 'Unknown'}")
        
        return True
        
    except Exception as e:
        print(f"❌ Backup creation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_existing_backups():
    """Check existing backups"""
    print("\nChecking existing backups...")
    
    try:
        backups = Backup.objects.all().order_by('-created_at')[:5]
        
        if not backups:
            print("❌ No backups found")
            return
        
        for backup in backups:
            print(f"📦 {backup.name}")
            print(f"   ID: {backup.id}")
            print(f"   Type: {backup.backup_type}")
            print(f"   Status: {backup.status}")
            print(f"   Created: {backup.created_at}")
            print(f"   File: {backup.file}")
            print(f"   File Size: {backup.file_size}")
            print(f"   Progress: {backup.progress}%")
            print()
        
    except Exception as e:
        print(f"❌ Error checking backups: {str(e)}")

if __name__ == '__main__':
    print("🔧 Backup API Test")
    print("=" * 50)
    
    # Check existing backups first
    test_existing_backups()
    
    # Test backup creation
    success = test_backup_creation()
    
    print("\n" + "=" * 50)
    if success:
        print("✅ Backup API test completed!")
    else:
        print("❌ Backup API test failed!")
    
    sys.exit(0 if success else 1)
