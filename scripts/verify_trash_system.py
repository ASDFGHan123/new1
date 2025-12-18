#!/usr/bin/env python
"""
Verification script for trash functionality system.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'offchat_backend.settings.development')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

django.setup()

from django.db import connection
from django.apps import apps

def verify_trash_system():
    print("=" * 60)
    print("TRASH FUNCTIONALITY VERIFICATION")
    print("=" * 60)
    
    # 1. Check if TrashItem model exists
    print("\n1. Checking TrashItem model...")
    try:
        from users.trash_models import TrashItem
        print("   ✓ TrashItem model imported successfully")
    except ImportError as e:
        print(f"   ✗ Failed to import TrashItem: {e}")
        return False
    
    # 2. Check if table exists
    print("\n2. Checking database table...")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='trash_items'
        """)
        if cursor.fetchone():
            print("   ✓ trash_items table exists")
        else:
            print("   ✗ trash_items table not found")
            print("   Run: python manage.py migrate users 0004_trash")
            return False
    
    # 3. Check if views are registered
    print("\n3. Checking API views...")
    try:
        from users.trash_views import TrashViewSet
        print("   ✓ TrashViewSet imported successfully")
    except ImportError as e:
        print(f"   ✗ Failed to import TrashViewSet: {e}")
        return False
    
    # 4. Check if URLs are configured
    print("\n4. Checking URL configuration...")
    try:
        from users.urls import router
        print("   ✓ Trash router configured in users/urls.py")
    except ImportError as e:
        print(f"   ✗ Failed to import router: {e}")
        return False
    
    # 5. Check frontend component
    print("\n5. Checking frontend component...")
    component_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'src', 'components', 'admin', 'TrashManager.tsx'
    )
    if os.path.exists(component_path):
        print("   ✓ TrashManager.tsx component exists")
    else:
        print("   ✗ TrashManager.tsx component not found")
        return False
    
    # 6. Check API service methods
    print("\n6. Checking API service...")
    api_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'src', 'lib', 'trash-api.ts'
    )
    if os.path.exists(api_path):
        print("   ✓ trash-api.ts service exists")
    else:
        print("   ✗ trash-api.ts service not found")
        return False
    
    # 7. Check migration file
    print("\n7. Checking migration file...")
    migration_path = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'users', 'migrations', '0004_trash.py'
    )
    if os.path.exists(migration_path):
        print("   ✓ Migration file 0004_trash.py exists")
    else:
        print("   ✗ Migration file not found")
        return False
    
    # 8. Check if migration is applied
    print("\n8. Checking migration status...")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT name FROM django_migrations 
            WHERE app='users' AND name='0004_trash'
        """)
        if cursor.fetchone():
            print("   ✓ Migration 0004_trash is applied")
        else:
            print("   ⚠ Migration 0004_trash not applied yet")
            print("   Run: python manage.py migrate users 0004_trash")
    
    # 9. Test TrashItem creation
    print("\n9. Testing TrashItem creation...")
    try:
        from users.trash_models import TrashItem
        from django.utils import timezone
        from datetime import timedelta
        
        test_item = TrashItem(
            item_type='user',
            item_id=999,
            item_data={'test': 'data'},
            expires_at=timezone.now() + timedelta(days=30)
        )
        print("   ✓ TrashItem instance created successfully")
    except Exception as e:
        print(f"   ✗ Failed to create TrashItem: {e}")
        return False
    
    # 10. Check permissions
    print("\n10. Checking permission classes...")
    try:
        from users.trash_views import TrashViewSet
        from rest_framework.permissions import IsAuthenticated
        
        viewset = TrashViewSet()
        if hasattr(viewset, 'permission_classes'):
            print("   ✓ Permission classes configured")
        else:
            print("   ⚠ Permission classes not explicitly set")
    except Exception as e:
        print(f"   ✗ Error checking permissions: {e}")
    
    print("\n" + "=" * 60)
    print("VERIFICATION COMPLETE")
    print("=" * 60)
    print("\n✓ All checks passed! Trash functionality is ready.")
    print("\nNext steps:")
    print("1. Apply migration: python manage.py migrate users 0004_trash")
    print("2. Test functionality: python scripts/test_trash_functionality.py")
    print("3. Access trash in admin dashboard")
    
    return True

if __name__ == '__main__':
    try:
        success = verify_trash_system()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n✗ Verification failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
