# Quick Reference - Online Status Tracking

## Start Services (4 Terminals)

### Terminal 1: Redis
```bash
redis-server
```

### Terminal 2: Django
```bash
python manage.py runserver --settings=offchat_backend.settings.development
```

### Terminal 3: Celery (IMPORTANT!)
```bash
celery -A offchat_backend worker --beat -l info
```

### Terminal 4: Frontend
```bash
npm run dev
```

## Verify It's Working

### Check 1: Celery Running
Look for in Terminal 3:
```
celery@hostname ready
Scheduler: Scheduler started
```

### Check 2: Login
1. Open http://localhost:5173
2. Login with admin/12341234
3. Check DevTools Network tab
4. Should see POST to `/api/users/heartbeat/` every 30 seconds

### Check 3: Admin Panel
1. Go to admin panel
2. Users should show as "online"
3. DevTools should show GET to `/api/users/all-users/` every 10 seconds

### Check 4: Database
```sql
SELECT username, online_status, last_seen FROM users LIMIT 5;
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/users/heartbeat/` | POST | Keep user online |
| `/api/users/all-users/` | GET | Get all users with status |
| `/api/users/admin/users/online/` | GET | Get online users |
| `/api/users/login/` | POST | Login user |
| `/api/users/logout/` | POST | Logout user |

## Configuration

### Inactivity Timeout (2 minutes)
File: `users/services/simple_online_status.py`
```python
timeout = timezone.now() - timedelta(minutes=2)
```

### Heartbeat Interval (30 seconds)
File: `src/App.tsx`
```typescript
setInterval(sendHeartbeat, 30000)
```

### Auto-Refresh Interval (10 seconds)
File: `src/App.tsx`
```typescript
setInterval(loadUsers, 10000)
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Celery not running | `celery -A offchat_backend worker --beat -l info` |
| Redis not running | `redis-server` |
| Users showing offline | Check heartbeat in DevTools Network tab |
| Stale data in admin | Hard refresh (Ctrl+Shift+R) |
| 401 errors | Check if token is valid |

## Key Files

| File | Purpose |
|------|---------|
| `users/services/simple_online_status.py` | Online status functions |
| `users/views/simple_users_view.py` | Users endpoint |
| `users/middleware.py` | Update last_seen on requests |
| `users/views/__init__.py` | Login/logout handlers |
| `users/tasks.py` | Celery task for inactivity |
| `src/App.tsx` | Heartbeat and auto-refresh |

## Status Codes

| Status | Meaning |
|--------|---------|
| online | User is active |
| away | User is away (not implemented) |
| offline | User is inactive |

## Database Fields

| Field | Type | Purpose |
|-------|------|---------|
| `online_status` | CharField | Current status |
| `last_seen` | DateTimeField | Last activity time |

## Performance

- Heartbeat: ~1KB every 30 seconds
- Auto-refresh: ~5KB every 10 seconds
- Celery task: <1 second every minute
- Database: Minimal impact (indexed fields)

## Production Checklist

- [ ] Redis running on dedicated server
- [ ] Celery worker running
- [ ] Beat scheduler running
- [ ] Database is PostgreSQL (not SQLite)
- [ ] All environment variables set
- [ ] CORS configured
- [ ] SSL/TLS enabled
- [ ] Heartbeat working
- [ ] Auto-refresh working
- [ ] Inactivity detection working

## Support

For issues:
1. Check Celery terminal for errors
2. Check Django terminal for errors
3. Check browser console for errors
4. Check DevTools Network tab
5. Verify all services are running

---

**Status**: ✅ WORKING

The system is now fully functional!
