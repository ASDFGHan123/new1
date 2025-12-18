# Quick Integration Guide - Critical Fixes

## Step 1: Update Django Settings

Edit `offchat_backend/settings/base.py`:

```python
# Add at the top after other imports
from offchat_backend.settings.security import *

# Update MIDDLEWARE list
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'offchat_backend.middleware.MediaCORSMiddleware',
    'offchat_backend.validation_middleware.InputValidationMiddleware',  # NEW
    'offchat_backend.validation_middleware.RateLimitMiddleware',  # NEW
]
```

## Step 2: Update User URLs

Edit `users/urls.py`:

```python
from django.urls import path
from users.auth_views import login_view, signup_view, logout_view, profile_view

urlpatterns = [
    # New secure auth endpoints
    path('auth/login/', login_view, name='login'),
    path('auth/register/', signup_view, name='signup'),
    path('auth/logout/', logout_view, name='logout'),
    path('auth/profile/', profile_view, name='profile'),
    
    # ... existing endpoints ...
]
```

## Step 3: Verify Frontend Changes

The following files have been automatically updated:
- ✅ `src/components/auth/LoginForm.tsx` - Input validation added
- ✅ `src/contexts/AuthContext.tsx` - Error handling improved

## Step 4: Test the Changes

### Test Input Validation
```bash
# Try login with empty credentials
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"","password":""}'
# Expected: 400 Bad Request
```

### Test Rate Limiting
```bash
# Send 101 requests rapidly
for i in {1..101}; do
  curl -X POST http://localhost:8000/api/auth/login/ \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}'
done
# Expected: 429 Too Many Requests after 100 requests
```

### Test CORS
```bash
# Request from unauthorized origin
curl -X GET http://localhost:8000/media/avatars/test.jpg \
  -H "Origin: http://unauthorized.com"
# Expected: No Access-Control-Allow-Origin header
```

## Step 5: Production Configuration

Before deploying to production, update `offchat_backend/settings/production.py`:

```python
# Security
DEBUG = False
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS - Update with your domain
CORS_ALLOWED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]

CSRF_TRUSTED_ORIGINS = [
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]

# JWT
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.environ.get('SECRET_KEY'),
}
```

## Step 6: Run Migrations

```bash
python manage.py migrate --settings=offchat_backend.settings.production
```

## Step 7: Collect Static Files

```bash
python manage.py collectstatic --settings=offchat_backend.settings.production
```

## Step 8: Restart Services

```bash
# Restart Django
systemctl restart offchat-django

# Restart Nginx (if using)
systemctl restart nginx
```

## Verification Checklist

- [ ] Django starts without errors
- [ ] Login form validates input
- [ ] Rate limiting works (429 after 100 requests)
- [ ] CORS headers present for allowed origins
- [ ] Security headers present in responses
- [ ] Tokens cleared on logout
- [ ] Form disabled during loading
- [ ] No console errors in browser

## Troubleshooting

### Issue: ImportError for security module
**Solution**: Ensure `offchat_backend/settings/security.py` exists

### Issue: Rate limiting too strict
**Solution**: Adjust limit in `validation_middleware.py` line 50:
```python
if self.request_counts[key] > 100:  # Change 100 to desired limit
```

### Issue: CORS still allowing all origins
**Solution**: Verify `CORS_ALLOWED_ORIGINS` is set in `security.py`

### Issue: Form not disabling during load
**Solution**: Verify `isLoading` prop is passed to inputs in `LoginForm.tsx`

## Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `src/components/auth/LoginForm.tsx` | Login form with validation | ✅ Updated |
| `src/contexts/AuthContext.tsx` | Auth context with error handling | ✅ Updated |
| `offchat_backend/middleware.py` | CORS middleware | ✅ Updated |
| `offchat_backend/settings/base.py` | Django settings | ✅ Updated |
| `offchat_backend/settings/security.py` | Security config | ✅ New |
| `offchat_backend/validation_middleware.py` | Validation middleware | ✅ New |
| `users/auth_views.py` | Secure auth endpoints | ✅ New |
| `src/lib/api-security-fix.ts` | Input validators | ✅ New |

## Support

For detailed information, see:
- `SECURITY_FIXES.md` - Detailed security documentation
- `CRITICAL_FIXES_SUMMARY.md` - Summary of all fixes
