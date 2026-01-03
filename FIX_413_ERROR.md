# 413 Content Too Large Error - Fix Summary

## Root Cause
The `InputValidationMiddleware` was limiting request body size to **1MB**, which is too small for messages with attachments.

## Files Modified

### 1. `offchat_backend/settings/base.py`
```python
# BEFORE
FILE_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 5242880  # 5MB

# AFTER
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
```

### 2. `offchat_backend/settings/development.py`
Added explicit file upload limits:
```python
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600  # 100MB
```

### 3. `offchat_backend/validation_middleware.py`
```python
# BEFORE
MAX_BODY_SIZE = 1024 * 1024  # 1MB

# AFTER
MAX_BODY_SIZE = 104857600  # 100MB
```

## Impact
- ✅ Messages with attachments up to 100MB can now be sent
- ✅ File uploads work without 413 errors
- ✅ Backward compatible with existing code

## Testing
The error should now be resolved. If you still see 413 errors:
1. Restart the Django server
2. Clear browser cache
3. Check if using a reverse proxy (Nginx/Apache) with its own size limits

## Limits Summary
| Setting | Before | After |
|---------|--------|-------|
| FILE_UPLOAD_MAX_MEMORY_SIZE | 5MB | 100MB |
| DATA_UPLOAD_MAX_MEMORY_SIZE | 5MB | 100MB |
| Middleware MAX_BODY_SIZE | 1MB | 100MB |
