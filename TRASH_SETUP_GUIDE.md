# Trash Functionality Setup Guide

## Quick Start

### 1. Apply Database Migration
```bash
python manage.py migrate users 0004_trash
```

### 2. Verify Installation
```bash
python scripts/test_trash_functionality.py
```

### 3. Access Trash in Admin Dashboard
- Login to admin dashboard
- Click "Trash" in sidebar
- View and manage deleted items

## What's Included

### Backend
✓ TrashItem model with 30-day expiration
✓ REST API endpoints for trash management
✓ Soft delete integration with user deletion
✓ Automatic expiration handling
✓ Admin-only access control

### Frontend
✓ TrashManager component with full UI
✓ Restore and permanent delete buttons
✓ Expiration countdown display
✓ Empty trash functionality
✓ Toast notifications for actions

### Database
✓ Migration file for TrashItem model
✓ Optimized indexes for performance
✓ JSON storage for deleted item data

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trash/` | List all trash items |
| POST | `/api/trash/restore/` | Restore item from trash |
| DELETE | `/api/trash/{id}/` | Permanently delete item |
| POST | `/api/trash/empty_trash/` | Delete all expired items |
| GET | `/api/trash/by_type/?type=user` | Filter by type |

## Features

### Soft Delete
- Users moved to trash instead of permanently deleted
- Original data preserved as JSON
- 30-day retention period

### Restore
- Recover deleted users
- Restore to active status
- Full data recovery from backup

### Permanent Delete
- Remove items permanently
- Cannot be undone
- Requires confirmation

### Auto-Expiration
- Items expire after 30 days
- Visual countdown in UI
- Automatic cleanup available

## Testing

### Manual Testing
1. Create a test user
2. Delete the user (moves to trash)
3. Go to Trash tab
4. Verify user appears in trash
5. Click Restore to recover
6. Verify user is active again

### Automated Testing
```bash
python scripts/test_trash_functionality.py
```

## Troubleshooting

### Migration Not Applied
```bash
# Check status
python manage.py showmigrations users

# Apply manually
python manage.py migrate users 0004_trash
```

### Trash Tab Not Showing
- Clear browser cache
- Restart development server
- Check browser console for errors

### Restore Not Working
- Verify user has admin permissions
- Check API token is valid
- Ensure item exists in trash

## Performance Notes

- Trash queries are indexed for fast performance
- JSON storage is efficient for data backup
- Pagination handles large trash lists
- Auto-expiration can be scheduled as background task

## Security

- Only admins can access trash
- All deletions logged with admin info
- Original data encrypted in JSON
- Automatic cleanup after 30 days

## Next Steps

1. ✓ Apply migration
2. ✓ Test functionality
3. ✓ Train admins on usage
4. ✓ Monitor performance
5. Consider scheduling auto-cleanup job

## Support

For issues or questions:
1. Check `docs/TRASH_IMPLEMENTATION.md` for detailed docs
2. Review test script: `scripts/test_trash_functionality.py`
3. Check API responses for error messages
4. Review browser console for frontend errors

## Files Summary

### New Files
- `users/trash_models.py` - TrashItem model
- `users/trash_views.py` - API endpoints
- `users/migrations/0004_trash.py` - Database migration
- `src/components/admin/TrashManager.tsx` - Frontend component
- `src/lib/trash-api.ts` - API service methods
- `scripts/apply_trash_migration.py` - Migration script
- `scripts/test_trash_functionality.py` - Test script

### Modified Files
- `users/urls.py` - Added trash router
- `users/views/__init__.py` - Updated delete method
- `src/components/admin/AdminContent.tsx` - Added trash case
- `src/components/admin/AdminSidebar.tsx` - Already has trash tab

## Deployment

1. Apply migration on production
2. Test in staging first
3. Monitor trash table size
4. Set up scheduled cleanup job
5. Document for team

---

**Status**: ✓ Ready for Production
**Version**: 1.0
**Last Updated**: 2024
