# Celery Setup Verification Checklist

## Pre-Setup

- [ ] Python 3.9+ installed
- [ ] Virtual environment activated
- [ ] Dependencies installed: `pip install -r requirements.txt`

## Redis Setup

- [ ] Redis installed or Docker available
- [ ] Redis running on localhost:6379
- [ ] Verify with: `redis-cli ping` (should return PONG)

## Celery Configuration

- [ ] `offchat_backend/celery.py` exists
- [ ] `offchat_backend/settings/development.py` has CELERY settings
- [ ] `CELERY_BROKER_URL = 'redis://localhost:6379/0'`
- [ ] `CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'`

## Task Files

- [ ] `users/notification_tasks.py` exists with tasks
- [ ] `users/admin_activity_notifier.py` uses async tasks
- [ ] `users/admin_activity_signals.py` triggers notifications

## Starting Services

### Redis
```bash
# Check Redis is running
redis-cli ping
# Expected output: PONG
```

### Celery Worker
```bash
# Start Celery
celery -A offchat_backend worker -l info

# Expected output:
# - "celery@<hostname> ready"
# - "Connected to redis://localhost:6379/0"
# - "Registered tasks: [list of tasks]"
```

- [ ] Celery worker started successfully
- [ ] Connected to Redis
- [ ] Tasks registered (should see notification tasks)

### Django & React
```bash
# Terminal 1: Django
python manage.py runserver --settings=offchat_backend.settings.development

# Terminal 2: React
npm run dev

# Terminal 3: Celery (already running)
```

- [ ] Django running on http://localhost:8000
- [ ] React running on http://localhost:5173
- [ ] Celery worker running in background

## Functional Testing

### Test 1: Send a Message
1. [ ] Open chat app at http://localhost:5173
2. [ ] Login with admin/12341234
3. [ ] Send a message
4. [ ] **Verify**: Message appears instantly (no delay)
5. [ ] Check Celery logs for notification task

### Test 2: Check Admin Notifications
1. [ ] Open admin panel
2. [ ] Go to Notifications section
3. [ ] **Verify**: New notification appears for message sent
4. [ ] Check notification has correct details

### Test 3: Verify Celery Tasks
```bash
# In another terminal, check active tasks
celery -A offchat_backend inspect active

# Expected output: Shows notification tasks being processed
```

- [ ] Tasks appear in active list
- [ ] Tasks complete successfully
- [ ] No errors in Celery logs

### Test 4: Monitor with Flower (Optional)
```bash
pip install flower
celery -A offchat_backend flower
# Open http://localhost:5555
```

- [ ] Flower dashboard loads
- [ ] Tasks visible in real-time
- [ ] Task success rate > 95%

## Performance Verification

### Before Celery Fix
- Message sending: ~500-1000ms
- Admin notifications: Blocking

### After Celery Fix
- [ ] Message sending: ~50-100ms (10x faster)
- [ ] Admin notifications: Non-blocking
- [ ] User experience: Instant feedback

## Troubleshooting Checklist

If something doesn't work:

### Redis Issues
- [ ] Redis running: `redis-cli ping`
- [ ] Port 6379 not blocked by firewall
- [ ] No other Redis instance on same port

### Celery Issues
- [ ] Celery worker running in terminal
- [ ] No import errors in Celery logs
- [ ] Tasks registered: `celery -A offchat_backend inspect registered`
- [ ] Check logs for errors: Look for "ERROR" in Celery output

### Django Issues
- [ ] Django running: `python manage.py runserver`
- [ ] Database migrated: `python manage.py migrate`
- [ ] No import errors in Django logs

### Task Issues
- [ ] Task file exists: `users/notification_tasks.py`
- [ ] Task decorated with `@shared_task`
- [ ] Task imported in `__init__.py` or autodiscovered
- [ ] Check task signature matches call

## Production Readiness

- [ ] Celery configured for production
- [ ] Redis configured for persistence
- [ ] Celery Beat configured for scheduled tasks
- [ ] Monitoring/alerting set up
- [ ] Error handling and retries configured
- [ ] Logs configured and rotated

## Documentation

- [ ] Read `CELERY_QUICK_START.md`
- [ ] Read `docs/CELERY_SETUP.md`
- [ ] Understand task flow in code
- [ ] Know how to monitor Celery

## Sign-Off

- [ ] All checks passed
- [ ] Message sending is fast
- [ ] Admin notifications working
- [ ] No errors in logs
- [ ] Ready for production

---

**Date Verified**: _______________
**Verified By**: _______________
**Notes**: _______________________________________________
