# Quick Start Guide - Online Status Tracking System

## Prerequisites

- Python 3.9+
- Node.js 18+
- Redis server
- Git

## Installation

### 1. Clone Repository
```bash
cd c:\Users\salaam\Desktop
git clone <repository-url>
cd offchat-admin-nexus-main
```

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements-dev.txt

# Run migrations
python manage.py migrate --settings=offchat_backend.settings.development

# Create superuser (if needed)
python manage.py createsuperuser --settings=offchat_backend.settings.development
```

### 3. Frontend Setup

```bash
# Install Node dependencies
npm install

# Build frontend (optional, for production)
npm run build
```

## Running the System

### Terminal 1: Django Development Server
```bash
# Activate virtual environment first
venv\Scripts\activate

# Start Django server
python manage.py runserver --settings=offchat_backend.settings.development
```

Expected output:
```
Starting development server at http://127.0.0.1:8000/
```

### Terminal 2: Redis Server
```bash
# Start Redis (make sure Redis is installed)
redis-server

# Or if using Windows with WSL:
wsl redis-server
```

Expected output:
```
Ready to accept connections
```

### Terminal 3: Celery Worker with Beat Scheduler
```bash
# Activate virtual environment first
venv\Scripts\activate

# Start Celery worker with beat scheduler
celery -A offchat_backend worker --beat -l info
```

Expected output:
```
celery@hostname ready.
[tasks]
  * users.tasks.check_and_mark_offline_users
```

### Terminal 4: React Development Server
```bash
# Start React development server
npm run dev
```

Expected output:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

## Accessing the System

1. **Admin Dashboard**: http://localhost:5173/admin-login
   - Username: `admin`
   - Password: `12341234`

2. **API Documentation**: http://localhost:8000/api/docs/ (if available)

3. **Django Admin**: http://localhost:8000/admin/
   - Username: `admin`
   - Password: `12341234`

## Testing Online Status Tracking

### Test 1: Login and Verify Online Status
1. Login as admin user
2. Open browser DevTools (F12)
3. Go to Console tab
4. You should see heartbeat messages every 30 seconds
5. Check admin panel - admin should show as "online"

### Test 2: Auto-Refresh
1. Open admin panel
2. User list should auto-refresh every 10 seconds
3. Check browser Network tab to see requests to `/api/users/all-users/`

### Test 3: Inactivity Timeout
1. Login as a user
2. Wait 2+ minutes without any activity
3. User should automatically go offline
4. Check Celery logs to see the offline marking task

### Test 4: Account Status Validation
1. Create a new user
2. Suspend the user
3. Even if user is logged in, they should show as "offline"
4. Activate the user again
5. User should be able to go online again

### Test 5: Logout
1. Login as a user
2. Click logout
3. User should immediately show as "offline"

## Monitoring

### Check Celery Beat Schedule
```bash
# In Celery terminal, you should see:
[2024-01-01 12:00:00,000: INFO/MainProcess] Scheduler: Sending due task check-offline-users (users.tasks.check_and_mark_offline_users)
```

### Check Heartbeat Requests
1. Open browser DevTools (F12)
2. Go to Network tab
3. Filter by "heartbeat"
4. You should see POST requests every 30 seconds

### Check Database
```bash
# Open Django shell
python manage.py shell --settings=offchat_backend.settings.development

# Check user online status
from users.models import User
user = User.objects.get(username='admin')
print(f"Online Status: {user.online_status}")
print(f"Last Seen: {user.last_seen}")
print(f"Account Status: {user.status}")
```

## Troubleshooting

### Issue: Users showing as offline despite being logged in

**Solution 1: Check heartbeat URL**
- Open browser DevTools (F12)
- Go to Console tab
- Look for heartbeat error messages
- Verify URL is `http://localhost:8000/api/users/heartbeat/`

**Solution 2: Check user account status**
```bash
python manage.py shell --settings=offchat_backend.settings.development
from users.models import User
user = User.objects.get(username='admin')
print(f"is_active: {user.is_active}")
print(f"status: {user.status}")
# Both should be: is_active=True, status='active'
```

**Solution 3: Check token validity**
- Open browser DevTools (F12)
- Go to Application/Storage tab
- Check if `access_token` exists in localStorage
- Token should not be expired

### Issue: Celery not running offline marking task

**Solution 1: Check Redis connection**
```bash
redis-cli ping
# Should return: PONG
```

**Solution 2: Check Celery configuration**
- Verify `CELERY_TASK_ALWAYS_EAGER = False` in settings
- Verify beat schedule is configured in celery.py

**Solution 3: Restart Celery worker**
```bash
# Stop current Celery worker (Ctrl+C)
# Restart with:
celery -A offchat_backend worker --beat -l info
```

### Issue: Admin panel not auto-refreshing

**Solution 1: Check network requests**
- Open browser DevTools (F12)
- Go to Network tab
- Filter by "all-users"
- Should see requests every 10 seconds

**Solution 2: Check user authentication**
- Verify user is logged in
- Check if access token is valid
- Try logging out and logging back in

**Solution 3: Check browser console**
- Open browser DevTools (F12)
- Go to Console tab
- Look for error messages
- Check if API endpoint is accessible

## Performance Tips

1. **Reduce Heartbeat Interval**: Change from 30 seconds to 60 seconds for less server load
   - Edit: src/App.tsx line 200
   - Change: `setInterval(sendHeartbeat, 30000)` to `setInterval(sendHeartbeat, 60000)`

2. **Reduce Admin Refresh Interval**: Change from 10 seconds to 30 seconds
   - Edit: src/App.tsx line 220
   - Change: `setInterval(loadUsers, 10000)` to `setInterval(loadUsers, 30000)`

3. **Increase Inactivity Timeout**: Change from 2 minutes to 5 minutes
   - Edit: users/services/simple_online_status.py line 50
   - Change: `timedelta(minutes=2)` to `timedelta(minutes=5)`

## Production Deployment

For production deployment, see `PRODUCTION_DEPLOYMENT.md` for:
- Environment configuration
- Database setup (PostgreSQL)
- Redis configuration
- Gunicorn setup
- Nginx configuration
- SSL/TLS setup
- Monitoring and logging

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review SYSTEM_VERIFICATION_CHECKLIST.md
3. Check logs in each terminal
4. Review browser DevTools console and network tabs

---

**System Version**: 1.0
**Last Updated**: 2024
**Status**: ✅ READY TO USE
