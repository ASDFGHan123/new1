#!/usr/bin/env python
"""
Test script to verify trash functionality is working correctly.
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from users.models import User
from users.trash_models import TrashItem
from users.services.user_management_service import UserManagementService

def test_trash_functionality():
    """Test that deleted users appear in trash."""
    print("Testing trash functionality...")
    
    # Create a test user
    test_user = User.objects.create_user(
        username='test_trash_user',
        email='test_trash@example.com',
        password='testpass123'
    )
    print(f"✓ Created test user: {test_user.username}")
    
    # Delete the user using the service
    result = UserManagementService.delete_user(test_user.id, permanent=True)
    print(f"✓ Deleted user: {result}")
    
    # Check if trash item was created
    trash_items = TrashItem.objects.filter(item_type='user', item_id=test_user.id)
    
    if trash_items.exists():
        trash_item = trash_items.first()
        print(f"✓ Trash item created successfully!")
        print(f"  - Item Type: {trash_item.item_type}")
        print(f"  - Item ID: {trash_item.item_id}")
        print(f"  - Deleted At: {trash_item.deleted_at}")
        print(f"  - Expires At: {trash_item.expires_at}")
        print(f"  - Item Data: {trash_item.item_data}")
        return True
    else:
        print("✗ ERROR: Trash item was NOT created!")
        return False

if __name__ == '__main__':
    success = test_trash_functionality()
    sys.exit(0 if success else 1)
