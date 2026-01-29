#!/usr/bin/env python
"""
Test script to verify backup system functionality
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

def test_backup_creation():
    """Test backup creation functionality"""
    print("Testing backup creation...")
    
    try:
        # Get admin user
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            print("❌ No admin user found")
            return False
        
        print(f"✅ Found admin user: {admin_user.username}")
        
        # Test backup creation
        result = BackupRestoreService.create_backup(
            backup_type='full',
            name='Test_Backup',
            description='Test backup for verification',
            admin_user=admin_user
        )
        
        print(f"✅ Backup created successfully: {result}")
        return True
        
    except Exception as e:
        print(f"❌ Backup creation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_backup_status():
    """Test backup status functionality"""
    print("\nTesting backup status...")
    
    try:
        # Get latest backup
        from admin_panel.models import Backup
        latest_backup = Backup.objects.order_by('-created_at').first()
        
        if not latest_backup:
            print("❌ No backup found")
            return False
        
        print(f"✅ Found backup: {latest_backup.name}")
        
        # Get status
        status = BackupRestoreService.get_backup_status(str(latest_backup.id))
        print(f"✅ Backup status: {status}")
        return True
        
    except Exception as e:
        print(f"❌ Backup status check failed: {str(e)}")
        return False

if __name__ == '__main__':
    print("🔧 Testing Backup System")
    print("=" * 50)
    
    success = True
    
    # Test backup creation
    if not test_backup_creation():
        success = False
    
    # Test backup status
    if not test_backup_status():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✅ All backup tests passed!")
    else:
        print("❌ Some tests failed!")
    
    sys.exit(0 if success else 1)
