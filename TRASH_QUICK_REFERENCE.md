# Trash Functionality - Quick Reference

## Installation (2 Steps)

```bash
# 1. Apply migration
python manage.py migrate users 0004_trash

# 2. Verify (optional)
python scripts/verify_trash_system.py
```

## Usage

### Admin Dashboard
1. Login to admin dashboard
2. Click **Trash** in sidebar
3. View deleted items with expiration dates
4. **Restore** - Click to recover item
5. **Delete** - Click to permanently remove
6. **Empty Trash** - Remove all expired items

### API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| List | `/api/trash/` | GET |
| Restore | `/api/trash/restore/` | POST |
| Delete | `/api/trash/{id}/` | DELETE |
| Empty | `/api/trash/empty_trash/` | POST |
| Filter | `/api/trash/by_type/?type=user` | GET |

## Features

✓ Soft delete (30-day retention)
✓ Restore deleted items
✓ Permanent delete
✓ Auto-expiration
✓ Audit trail
✓ Admin-only access

## Files Created

### Backend
- `users/trash_models.py` - TrashItem model
- `users/trash_views.py` - API endpoints
- `users/migrations/0004_trash.py` - Database migration

### Frontend
- `src/components/admin/TrashManager.tsx` - UI component
- `src/lib/trash-api.ts` - API methods

### Scripts
- `scripts/apply_trash_migration.py` - Apply migration
- `scripts/test_trash_functionality.py` - Test features
- `scripts/verify_trash_system.py` - Verify installation

### Documentation
- `TRASH_SETUP_GUIDE.md` - Setup guide
- `docs/TRASH_IMPLEMENTATION.md` - Full documentation
- `TRASH_IMPLEMENTATION_SUMMARY.md` - Implementation details

## Files Modified

- `users/urls.py` - Added trash router
- `users/views/__init__.py` - Updated delete method
- `src/components/admin/AdminContent.tsx` - Added trash case

## Testing

```bash
# Run tests
python scripts/test_trash_functionality.py

# Verify system
python scripts/verify_trash_system.py
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Migration not applied | `python manage.py migrate users 0004_trash` |
| Trash tab not showing | Clear browser cache, restart server |
| Restore not working | Check admin permissions, verify token |
| API errors | Check console, verify endpoints accessible |

## Key Points

- Items expire after **30 days**
- Only **admins** can access trash
- Original data **preserved as JSON**
- **Cannot be undone** after permanent delete
- **Audit trail** maintained for all actions

## Performance

- Optimized indexes for fast queries
- Pagination for large lists
- Efficient JSON storage
- Auto-cleanup available

## Security

- Admin-only access
- Audit logging
- Data backup
- Automatic expiration

## Status

✅ **PRODUCTION READY**

All components implemented and tested.

---

**Quick Links**
- Setup: `TRASH_SETUP_GUIDE.md`
- Docs: `docs/TRASH_IMPLEMENTATION.md`
- Summary: `TRASH_IMPLEMENTATION_SUMMARY.md`
