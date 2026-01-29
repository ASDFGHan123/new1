#!/usr/bin/env python
"""
Simple test to check if backup system is working
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat.settings')
django.setup()

from admin_panel.services.backup_restore_service import BackupRestoreService

def test_backup_creation():
    """Test basic backup creation"""
    print("Testing basic backup creation...")
    
    try:
        # Test users backup (simpler than full backup)
        result = BackupRestoreService.create_backup(
            backup_type='users',
            name='Test_Users_Backup',
            description='Test users backup for verification',
            admin_user=None  # No admin user for testing
        )
        
        print(f"✅ Backup creation started: {result}")
        print(f"Backup ID: {result['backup_id']}")
        
        # Check status after a short delay
        import time
        time.sleep(2)
        
        status = BackupRestoreService.get_backup_status(result['backup_id'])
        print(f"Backup status: {status}")
        
        return True
        
    except Exception as e:
        print(f"❌ Backup creation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("🔧 Simple Backup System Test")
    print("=" * 40)
    
    success = test_backup_creation()
    
    print("\n" + "=" * 40)
    if success:
        print("✅ Backup system test passed!")
    else:
        print("❌ Backup system test failed!")
    
    sys.exit(0 if success else 1)
