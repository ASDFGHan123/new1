# Sign-In Error Troubleshooting Guide

## Common Issues & Solutions

### 1. **Network/CORS Error**
**Error**: `Network Error` or `Failed to connect to server`

**Solution**:
- Verify backend is running: `python manage.py runserver --settings=offchat_backend.settings.development`
- Check if you can access `http://<YOUR_IP>:8000/api/auth/login/` from browser
- Ensure firewall allows port 8000
- Check browser console (F12) for detailed error

### 2. **Invalid Credentials**
**Error**: `Invalid credentials`

**Solution**:
- Default admin credentials:
  - Username: `admin`
  - Password: `12341234`
- Ensure you're using correct username/password
- Check if user exists: `python manage.py shell`
  ```python
  from users.models import User
  User.objects.filter(username='admin').exists()
  ```

### 3. **Account Pending Approval**
**Error**: `Your account is pending admin approval`

**Solution**:
- New users are created with `status='pending'`
- Admin must approve the account first
- Use Django admin to approve: `http://<YOUR_IP>:8000/admin/`
- Or use API: `POST /api/users/admin/users/<user_id>/approve/`

### 4. **Account Suspended/Banned**
**Error**: `Your account is suspended` or `Your account is banned`

**Solution**:
- Contact admin to reactivate account
- Check user status in Django admin
- Use API to reactivate: `POST /api/users/admin/users/<user_id>/activate/`

### 5. **Token Generation Failed**
**Error**: `Invalid token response from server`

**Solution**:
- Check Django logs for JWT errors
- Verify `SECRET_KEY` is set in settings
- Ensure `rest_framework_simplejwt` is installed
- Check if tokens are being generated: `python manage.py shell`
  ```python
  from rest_framework_simplejwt.tokens import RefreshToken
  from users.models import User
  user = User.objects.get(username='admin')
  refresh = RefreshToken.for_user(user)
  print(refresh.access_token)
  ```

### 6. **CORS Issues (LAN Access)**
**Error**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
- Verify development settings have CORS enabled:
  ```python
  # offchat_backend/settings/development.py
  CORS_ALLOW_ALL_ORIGINS = True
  ```
- Restart Django server after changes
- Check if request is being blocked by browser

### 7. **API URL Mismatch**
**Error**: `Failed to connect` or `404 Not Found`

**Solution**:
- Verify API URL is correct in frontend
- Check `vite.config.ts` or environment variables
- API should be: `http://<YOUR_IP>:8000/api`
- Test with curl:
  ```bash
  curl -X POST http://<YOUR_IP>:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"12341234"}'
  ```

## Debug Steps

### 1. Check Browser Console
- Open DevTools (F12)
- Go to Console tab
- Look for error messages
- Check Network tab for API requests

### 2. Check Backend Logs
```bash
# Terminal where Django is running
# Look for error messages and stack traces
```

### 3. Test API Directly
```bash
# Test login endpoint
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"12341234"}'

# Expected response:
# {
#   "user": {...},
#   "tokens": {
#     "access": "...",
#     "refresh": "..."
#   }
# }
```

### 4. Check Database
```bash
python manage.py shell
from users.models import User
User.objects.all().values('id', 'username', 'email', 'status', 'is_active')
```

### 5. Enable Debug Logging
Add to `offchat_backend/settings/development.py`:
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG',
    },
}
```

## Quick Fixes

### Reset Database
```bash
# Delete database
rm db.sqlite3

# Run migrations
python manage.py migrate --settings=offchat_backend.settings.development

# Create superuser
python manage.py createsuperuser --settings=offchat_backend.settings.development
```

### Clear Browser Cache
- Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- Clear all cache and cookies
- Reload page

### Restart Services
```bash
# Kill existing processes
# Windows: taskkill /F /IM python.exe
# Mac/Linux: pkill -f "python manage.py"

# Restart backend
python manage.py runserver --settings=offchat_backend.settings.development

# Restart frontend (in another terminal)
npm run dev
```

## Still Having Issues?

1. Check the browser console for specific error messages
2. Review backend logs for stack traces
3. Test API endpoint directly with curl
4. Verify database has users
5. Check CORS and firewall settings
6. Ensure both frontend and backend are running

## Contact Support

If issue persists:
- Check project documentation in `docs/`
- Review API logs for detailed errors
- Verify all dependencies are installed
- Ensure environment variables are set correctly
