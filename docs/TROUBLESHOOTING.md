# OffChat Admin Nexus - Troubleshooting Guide

## Table of Contents
- [Common Issues](#common-issues)
- [Backend Issues](#backend-issues)
- [Frontend Issues](#frontend-issues)
- [Database Issues](#database-issues)
- [Redis/Celery Issues](#rediscelery-issues)
- [Authentication Issues](#authentication-issues)
- [Performance Issues](#performance-issues)
- [WebSocket Issues](#websocket-issues)
- [Deployment Issues](#deployment-issues)

---

## Common Issues

### 1. Application Won't Start

#### Symptoms
- Django server fails to start
- Frontend dev server shows errors
- Services not connecting

#### Solutions
```bash
# Check Python environment
python --version
pip list

# Check Node environment
node --version
npm --version

# Restart services
python manage.py runserver
npm run dev
```

### 2. Environment Variables Not Loading

#### Symptoms
- Configuration errors
- Database connection failures
- Missing API keys

#### Solutions
```bash
# Verify .env file exists
ls -la .env

# Check environment variables
printenv | grep -E "(DB|REDIS|SECRET)"

# Reload environment
source .env
```

---

## Backend Issues

### 1. ModuleNotFoundError

#### Symptoms
```
ModuleNotFoundError: No module named 'django'
```

#### Solutions
```bash
# Activate virtual environment
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt

# Check Python path
which python
python -c "import sys; print(sys.path)"
```

### 2. Database Migration Errors

#### Symptoms
```
django.db.migrations.exceptions.InconsistentMigrationHistory
```

#### Solutions
```bash
# Check migration status
python manage.py showmigrations

# Reset migrations (development only)
python manage.py migrate app zero
python manage.py migrate app

# Fake initial migration
python manage.py migrate app --fake
```

### 3. Static Files Not Loading

#### Symptoms
- 404 errors for CSS/JS
- Broken styling
- Missing images

#### Solutions
```bash
# Collect static files
python manage.py collectstatic --noinput

# Check static settings
python manage.py shell
>>> from django.conf import settings
>>> settings.STATIC_ROOT
>>> settings.STATIC_URL

# Verify static files exist
ls -la static/
```

### 4. CORS Issues

#### Symptoms
```
Access to fetch at 'http://localhost:8000/api/' has been blocked by CORS policy
```

#### Solutions
```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# For development
CORS_ALLOW_ALL_ORIGINS = True
```

---

## Frontend Issues

### 1. npm Install Failures

#### Symptoms
```
npm ERR! code ERESOLVE
npm ERR! peer dep conflict
```

#### Solutions
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install

# Use legacy peer deps
npm install --legacy-peer-deps
```

### 2. TypeScript Errors

#### Symptoms
- Compilation errors
- Type mismatches
- Missing type definitions

#### Solutions
```bash
# Check TypeScript version
npx tsc --version

# Update types
npm update @types/react @types/node

# Strict type checking (tsconfig.json)
{
  "compilerOptions": {
    "strict": false,  // Temporarily disable
    "skipLibCheck": true
  }
}
```

### 3. Vite Development Server Issues

#### Symptoms
- Server won't start
- Port already in use
- HMR not working

#### Solutions
```bash
# Kill process on port
netstat -tulpn | grep :5173
kill -9 <PID>

# Clear Vite cache
rm -rf .vite

# Restart dev server
npm run dev -- --port 3000
```

---

## Database Issues

### 1. Connection Refused

#### Symptoms
```
django.db.utils.OperationalError: could not connect to server
```

#### Solutions
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -h localhost -U postgres -d offchat_db

# Verify database credentials
python manage.py shell
>>> from django.db import connection
>>> cursor = connection.cursor()
>>> cursor.execute("SELECT 1")
```

### 2. Permission Denied

#### Symptoms
```
django.db.utils.OperationalError: permission denied for database
```

#### Solutions
```sql
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE offchat_db TO offchat_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO offchat_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO offchat_user;
```

### 3. Lock Timeout

#### Symptoms
```
django.db.utils.OperationalError: could not obtain lock on relation
```

#### Solutions
```sql
-- Check active connections
SELECT * FROM pg_stat_activity WHERE datname = 'offchat_db';

-- Kill problematic connections
SELECT pg_terminate_backend(pid);

-- Check for locks
SELECT * FROM pg_locks;
```

---

## Redis/Celery Issues

### 1. Redis Connection Failed

#### Symptoms
```
redis.exceptions.ConnectionError: Error connecting to Redis
```

#### Solutions
```bash
# Check Redis status
redis-cli ping

# Start Redis
redis-server

# Check Redis configuration
redis-cli CONFIG GET bind
redis-cli CONFIG GET port
```

### 2. Celery Worker Not Starting

#### Symptoms
```
AttributeError: module 'celery' has no attribute 'Celery'
```

#### Solutions
```bash
# Check Celery installation
pip show celery

# Reinstall Celery
pip uninstall celery
pip install celery redis

# Check Celery configuration
python manage.py shell
>>> from offchat_backend.celery import app
>>> app
```

### 3. Tasks Not Executing

#### Symptoms
- Tasks queued but not processed
- Worker appears idle
- No task results

#### Solutions
```bash
# Check worker status
celery -A offchat_backend inspect active

# Check queued tasks
celery -A offchat_backend inspect reserved

# Purge queue
celery -A offchat_backend purge
```

---

## Authentication Issues

### 1. Token Not Found

#### Symptoms
```
Admin token not found. Please login to admin dashboard first.
```

#### Solutions
```javascript
// Check token storage
console.log(localStorage.getItem('admin_access_token'));
console.log(sessionStorage.getItem('admin_access_token'));

// Clear and re-login
localStorage.clear();
sessionStorage.clear();
```

### 2. JWT Token Expired

#### Symptoms
- Frequent logouts
- 401 Unauthorized errors
- Token refresh failures

#### Solutions
```python
# Check token expiration
import jwt
token = 'your-token-here'
decoded = jwt.decode(token, options={'verify_signature': False})
print(decoded['exp'])
```

### 3. Permission Denied

#### Symptoms
- 403 Forbidden errors
- Missing permissions
- Access denied messages

#### Solutions
```bash
# Check user permissions
python manage.py shell
>>> from django.contrib.auth.models import User, Permission
>>> user = User.objects.get(username='your-username')
>>> user.user_permissions.all()
>>> user.has_perm('app.permission')
```

---

## Performance Issues

### 1. Slow API Responses

#### Symptoms
- Requests taking >5 seconds
- Database query timeouts
- Frontend loading delays

#### Solutions
```python
# Enable Django Debug Toolbar
pip install django-debug-toolbar

# Add to settings.py
INSTALLED_APPS += ['debug_toolbar']
MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']

# Check query performance
python manage.py shell
>>> from django.db import connection
>>> connection.queries
```

### 2. Memory Leaks

#### Symptoms
- Memory usage increasing
- Server crashes
- Slow response times

#### Solutions
```bash
# Check memory usage
ps aux | grep python
top -p <PID>

# Monitor Django memory
pip install memory_profiler
python -m memory_profiler manage.py runserver
```

### 3. Database Performance

#### Symptoms
- Slow queries
- High CPU usage
- Database locks

#### Solutions
```sql
-- Analyze slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Add indexes
CREATE INDEX CONCURRENTLY index_name ON table_name(column_name);
```

---

## WebSocket Issues

### 1. Connection Failed

#### Symptoms
```
WebSocket connection to 'ws://localhost:8000/ws/' failed
```

#### Solutions
```bash
# Use Daphne instead of Django dev server
pip install daphne
daphne offchat_backend.asgi:application

# Check Channels configuration
python manage.py shell
>>> from channels.layers import get_channel_layer
>>> layer = get_channel_layer()
```

### 2. Messages Not Received

#### Symptoms
- WebSocket connects but no messages
- Consumer not receiving events
- Connection drops

#### Solutions
```python
# Check consumer registration
python manage.py shell
>>> from channels.routing import get_default_application
>>> application = get_default_application()
```

### 3. Redis Channel Issues

#### Symptoms
- Channels not working
- Group messaging fails
- Real-time updates broken

#### Solutions
```bash
# Check Redis pub/sub
redis-cli
> SUBSCRIBE chat_*
> PUBLISH chat_room_1 "test message"
```

---

## Deployment Issues

### 1. Static Files 404

#### Symptoms
- CSS/JS files not loading
- 404 errors for static assets
- Broken styling in production

#### Solutions
```bash
# Collect static files for production
python manage.py collectstatic --noinput

# Configure Nginx for static files
location /static/ {
    alias /path/to/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 2. Database Migration Failures

#### Symptoms
- Migration errors in production
- Database schema mismatch
- Application won't start

#### Solutions
```bash
# Check migration status
python manage.py showmigrations --plan

# Run specific migration
python manage.py migrate app 0001

# Fake migration if needed
python manage.py migrate app --fake-initial
```

### 3. SSL Certificate Issues

#### Symptoms
- HTTPS not working
- Certificate errors
- Mixed content warnings

#### Solutions
```bash
# Generate SSL certificate (Let's Encrypt)
sudo certbot --nginx -d yourdomain.com

# Check certificate
openssl s_client -connect yourdomain.com:443
```

---

## Debugging Tools

### Django Debug Toolbar
```python
# settings.py
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1']
```

### Browser Developer Tools
- Network tab for API calls
- Console for JavaScript errors
- Application tab for storage
- Elements for DOM inspection

### Logging Configuration
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

---

## Getting Help

### Log Files to Check
1. **Django Logs**: `debug.log`
2. **Nginx Logs**: `/var/log/nginx/`
3. **PostgreSQL Logs**: `/var/log/postgresql/`
4. **Redis Logs**: `/var/log/redis/`
5. **System Logs**: `/var/log/syslog`

### Common Commands
```bash
# Check system resources
htop
df -h
free -m

# Check network connections
netstat -tulpn
ss -tulpn

# Check process status
ps aux | grep python
ps aux | grep node
```

### Support Channels
- Check documentation first
- Review error messages carefully
- Search issue trackers
- Ask for help with specific error details

---

## Prevention Tips

### Regular Maintenance
1. Update dependencies regularly
2. Monitor system resources
3. Check log files periodically
4. Test backup/restore procedures
5. Security audits

### Monitoring Setup
1. Application performance monitoring
2. Error tracking services
3. Uptime monitoring
4. Resource usage alerts
5. Security event logging

### Documentation
1. Document custom configurations
2. Keep track of changes
3. Maintain runbooks
4. Update troubleshooting guides
5. Share knowledge with team
