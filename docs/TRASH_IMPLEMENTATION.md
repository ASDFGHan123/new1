# Trash Functionality Implementation

## Overview
Complete trash management system for OffChat Admin Dashboard with soft delete functionality, automatic expiration, and restore capabilities.

## Architecture

### Backend Components

#### 1. Database Model (`users/trash_models.py`)
```python
TrashItem
- item_type: user, message, conversation
- item_id: ID of deleted item
- item_data: JSON backup of original data
- deleted_by: Admin who deleted the item
- deleted_at: Timestamp of deletion
- expires_at: Auto-delete after 30 days
```

#### 2. API Endpoints (`users/trash_views.py`)
- `GET /api/trash/` - List all trash items
- `POST /api/trash/restore/` - Restore item from trash
- `DELETE /api/trash/{id}/` - Permanently delete item
- `POST /api/trash/empty_trash/` - Delete all expired items
- `GET /api/trash/by_type/?type=user` - Filter by type

#### 3. User Deletion Flow
When admin deletes a user:
1. User data is serialized to JSON
2. TrashItem created with 30-day expiration
3. User marked as inactive and banned
4. User can be restored or permanently deleted

### Frontend Components

#### 1. TrashManager Component (`src/components/admin/TrashManager.tsx`)
- Display all trash items in table
- Show expiration countdown
- Restore functionality
- Permanent delete functionality
- Empty trash button

#### 2. Integration in AdminContent
- Trash tab in admin sidebar
- Renders TrashManager component
- Full CRUD operations

### API Service Methods (`src/lib/trash-api.ts`)
```typescript
- getTrash()
- restoreFromTrash(itemId, itemType)
- permanentlyDeleteFromTrash(itemId)
- emptyTrash()
```

## Database Migration

### Apply Migration
```bash
python manage.py migrate users 0004_trash
```

Or use the provided script:
```bash
python scripts/apply_trash_migration.py
```

### Migration Details
- Creates `trash_items` table
- Adds indexes on item_type, deleted_at, expires_at
- Supports all item types (user, message, conversation)

## Features

### 1. Soft Delete
- Items moved to trash instead of permanently deleted
- Original data preserved in JSON format
- User marked as inactive/banned

### 2. Automatic Expiration
- Items expire after 30 days
- Expired items can be auto-deleted
- Visual indicator for expiration countdown

### 3. Restore Functionality
- Restore deleted users to active status
- Restore original data from JSON backup
- Audit trail maintained

### 4. Permanent Delete
- Permanently remove items from trash
- Cannot be undone
- Requires admin confirmation

### 5. Bulk Operations
- Empty all expired items at once
- Filter by item type
- Batch restore/delete

## Usage

### Admin Dashboard
1. Navigate to Trash tab in sidebar
2. View all deleted items with expiration dates
3. Click "Restore" to recover item
4. Click "Delete" to permanently remove
5. Click "Empty Trash" to remove all expired items

### API Usage

#### List Trash Items
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/trash/
```

#### Restore Item
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"item_id": 1, "item_type": "user"}' \
  http://localhost:8000/api/trash/restore/
```

#### Permanently Delete
```bash
curl -X DELETE \
  -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/trash/1/
```

#### Empty Trash
```bash
curl -X POST \
  -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/trash/empty_trash/
```

## Testing

### Run Tests
```bash
python scripts/test_trash_functionality.py
```

### Test Coverage
- User deletion and trash creation
- Trash item listing
- User restoration
- Permanent deletion
- Expiration handling

## Security Considerations

1. **Permission Checks**: Only admins can access trash
2. **Audit Trail**: All deletions logged with admin info
3. **Data Backup**: Original data preserved in JSON
4. **Expiration**: Automatic cleanup after 30 days
5. **Soft Delete**: No immediate data loss

## Performance

### Indexes
- `item_type` - Fast filtering by type
- `deleted_at` - Fast sorting by deletion date
- `expires_at` - Fast expiration queries

### Query Optimization
- Pagination for large trash lists
- Efficient JSON storage
- Indexed lookups

## Future Enhancements

1. **Scheduled Cleanup**: Automatic expiration job
2. **Bulk Restore**: Restore multiple items at once
3. **Advanced Filtering**: Filter by date range, admin, type
4. **Export**: Export trash items for audit
5. **Retention Policies**: Configurable expiration periods
6. **Message/Conversation Trash**: Extend to other item types

## Troubleshooting

### Migration Issues
```bash
# Check migration status
python manage.py showmigrations users

# Rollback if needed
python manage.py migrate users 0003_ipaddress_suspiciousactivity_ipaccesslog
```

### API Issues
- Ensure user has admin permissions
- Check token validity
- Verify item exists in trash

### Frontend Issues
- Clear browser cache
- Check console for errors
- Verify API endpoints are accessible

## Files Modified/Created

### Backend
- `users/trash_models.py` - New
- `users/trash_views.py` - New
- `users/migrations/0004_trash.py` - New
- `users/urls.py` - Modified (added router)
- `users/views/__init__.py` - Modified (delete method)

### Frontend
- `src/components/admin/TrashManager.tsx` - New
- `src/components/admin/AdminContent.tsx` - Modified
- `src/lib/trash-api.ts` - New

### Scripts
- `scripts/apply_trash_migration.py` - New
- `scripts/test_trash_functionality.py` - New

## Deployment Checklist

- [ ] Apply migration: `python manage.py migrate`
- [ ] Test trash functionality: `python scripts/test_trash_functionality.py`
- [ ] Verify API endpoints work
- [ ] Test frontend UI
- [ ] Check permissions
- [ ] Monitor performance
- [ ] Document for team
