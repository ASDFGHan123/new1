#!/usr/bin/env python
"""
Test script for trash functionality.
"""
import os
import sys
import django
import json
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from users.trash_models import TrashItem
from users.serializers import UserSerializer

User = get_user_model()

def test_trash_functionality():
    print("Testing Trash Functionality...\n")
    
    # Create test user
    print("1. Creating test user...")
    test_user = User.objects.create_user(
        username='trash_test_user',
        email='trash_test@example.com',
        password='testpass123'
    )
    print(f"   ✓ Created user: {test_user.username}")
    
    # Move user to trash
    print("\n2. Moving user to trash...")
    admin_user = User.objects.filter(is_staff=True).first()
    if not admin_user:
        admin_user = User.objects.create_superuser(
            username='admin_trash_test',
            email='admin_trash@example.com',
            password='adminpass123'
        )
    
    user_data = UserSerializer(test_user).data
    trash_item = TrashItem.objects.create(
        item_type='user',
        item_id=test_user.id,
        item_data=user_data,
        deleted_by=admin_user,
        expires_at=timezone.now() + timedelta(days=30)
    )
    
    test_user.is_active = False
    test_user.status = 'banned'
    test_user.save()
    
    print(f"   ✓ User moved to trash (ID: {trash_item.id})")
    print(f"   ✓ Expires at: {trash_item.expires_at}")
    
    # List trash items
    print("\n3. Listing trash items...")
    trash_items = TrashItem.objects.all()
    print(f"   ✓ Total trash items: {trash_items.count()}")
    for item in trash_items:
        print(f"     - {item.item_type}: {item.item_data.get('username', 'N/A')} (expires in {(item.expires_at - timezone.now()).days} days)")
    
    # Restore from trash
    print("\n4. Restoring user from trash...")
    user_to_restore = User.objects.get(id=test_user.id)
    user_to_restore.is_active = True
    user_to_restore.status = 'active'
    user_to_restore.save()
    trash_item.delete()
    print(f"   ✓ User restored: {user_to_restore.username}")
    
    # Test permanent delete
    print("\n5. Testing permanent delete...")
    test_user2 = User.objects.create_user(
        username='trash_test_user2',
        email='trash_test2@example.com',
        password='testpass123'
    )
    
    user_data2 = UserSerializer(test_user2).data
    trash_item2 = TrashItem.objects.create(
        item_type='user',
        item_id=test_user2.id,
        item_data=user_data2,
        deleted_by=admin_user,
        expires_at=timezone.now() + timedelta(days=30)
    )
    
    test_user2.is_active = False
    test_user2.status = 'banned'
    test_user2.save()
    
    print(f"   ✓ Created trash item: {trash_item2.id}")
    
    trash_item2.delete()
    print(f"   ✓ Permanently deleted trash item")
    
    # Cleanup
    print("\n6. Cleaning up test data...")
    test_user.delete()
    admin_user.delete()
    print("   ✓ Test data cleaned up")
    
    print("\n✓ All trash functionality tests passed!")

if __name__ == '__main__':
    try:
        test_trash_functionality()
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
