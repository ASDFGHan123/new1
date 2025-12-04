# Network Access Fix Guide for OffChat Project

## Problem Summary
Your OffChat project at `192.168.2.9:8082` was not accessible from other devices, and authentication was failing. This guide explains the issues found and fixes applied.

## Issues Identified and Fixed

### 1. Django ALLOWED_HOSTS Configuration
**Problem**: Django was not configured to accept requests from your network IP `192.168.2.9`.

**Fix Applied**:
```python
# Before
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,testserver', ...)

# After  
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,192.168.2.9,testserver', ...)
```
**File**: `offchat_backend/settings.py` (Line 62)

### 2. CORS Configuration for Network Access
**Problem**: Cross-Origin Resource Sharing (CORS) was not allowing requests from your network IP.

**Fix Applied**:
```python
# Added network-specific CORS origins
CORS_ALLOWED_ORIGINS = [
    # ... existing localhost entries ...
    "http://192.168.2.9:5173",  # React dev server on network
    "http://192.168.2.9:8082",  # React dev server on network  
    "http://192.168.2.9:8080",  # Alternative React port on network
    "http://192.168.2.9:8081",  # Alternative React port on network
]
```
**File**: `offchat_backend/settings.py` (Lines 65-78)

### 3. Dynamic API URL Configuration
**Problem**: API URLs were hardcoded to localhost, preventing cross-device communication.

**Fix Applied**:
```typescript
private getApiBaseUrl(): string {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      return envUrl;
    }
    
    // Auto-detect based on current window location
    const hostname = window.location.hostname;
    const port = '8000';
    
    // If accessing from localhost or same machine, use localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:${port}/api`;
    }
    
    // If accessing from network, use the current host
    return `http://${hostname}:${port}/api`;
}
```
**File**: `src/lib/api.ts` (Lines 105-123)

### 4. Server Binding Configuration
**Problem**: Django server wasn't configured to bind to all network interfaces.

**Fix Applied**:
```powershell
# Server startup command now binds to all interfaces
python manage.py runserver 0.0.0.0:8000
```
**File**: `start_django.ps1` (Line 10)

### 5. Updated Server Messages
**Problem**: No clear indication of network access URLs in server startup messages.

**Fix Applied**: Enhanced startup scripts to display both local and network access URLs.

## How to Test the Fixes

### 1. Start the Servers
```powershell
# Run the main startup script
.\start_project.ps1
```

### 2. Run Network Verification
```bash
# Run the verification script
python network_access_verification.py
```

### 3. Test from Another Device
1. Make sure both devices are on the same network
2. Open browser on other device
3. Navigate to: `http://192.168.2.9:5173`
4. Try logging in with: `admin` / `12341234`

## Expected Results

### Local Machine (192.168.2.9)
- React Frontend: http://localhost:5173 ✅
- React Frontend Network: http://192.168.2.9:5173 ✅  
- Django Backend: http://localhost:8000 ✅
- Django Backend Network: http://192.168.2.9:8000 ✅
- Django Admin: http://localhost:8000/admin ✅
- Django Admin Network: http://192.168.2.9:8000/admin ✅

### External Devices
- React Frontend: http://192.168.2.9:5173 ✅
- Django Backend API: http://192.168.2.9:8000/api/ ✅
- Django Admin: http://192.168.2.9:8000/admin ✅

## Troubleshooting

### If External Access Still Fails

1. **Check Firewall Settings**:
   - Open Windows Defender Firewall
   - Allow Node.js and Python through firewall
   - Specifically allow ports 5173 and 8000

2. **Verify Network Configuration**:
   ```bash
   # Check your IP
   ipconfig
   
   # If your IP is different, update:
   # - offchat_backend/settings.py ALLOWED_HOSTS
   # - CORS_ALLOWED_ORIGINS in settings.py
   ```

3. **Test Port Connectivity**:
   ```bash
   # Test if ports are accessible
   telnet 192.168.2.9 5173
   telnet 192.168.2.9 8000
   ```

4. **Check Server Logs**:
   - Look for CORS errors in Django console
   - Check React dev server for network-related warnings

### Common Error Messages and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid credentials" | User not approved | Check user status in admin panel |
| "CORS policy" | Missing CORS configuration | Verify CORS_ALLOWED_ORIGINS includes network IP |
| "Bad Request (400)" | ALLOWED_HOSTS missing IP | Add your IP to ALLOWED_HOSTS |
| "Connection refused" | Server not running | Start servers using start_project.ps1 |
| "Network unreachable" | Firewall blocking | Configure Windows Firewall rules |

## Security Considerations

⚠️ **Important**: This configuration is for development/testing only.

For production deployment:
1. Use HTTPS instead of HTTP
2. Implement proper authentication
3. Use environment-specific configurations
4. Consider using a reverse proxy (nginx)
5. Implement proper SSL/TLS certificates

## Summary of Changes

| File | Change Type | Description |
|------|-------------|-------------|
| `offchat_backend/settings.py` | Modified | Added network IP to ALLOWED_HOSTS and CORS |
| `src/lib/api.ts` | Modified | Implemented dynamic API URL detection |
| `start_django.ps1` | Modified | Enhanced startup messages with network URLs |
| `start_project.ps1` | Modified | Updated access point information |
| `network_access_verification.py` | Created | Network connectivity testing tool |

## Next Steps

1. Restart your servers using `.\start_project.ps1`
2. Test network access from another device
3. If issues persist, run `python network_access_verification.py` for diagnostics
4. Verify authentication works from external devices

Your OffChat project should now be accessible from other devices on your network at `http://192.168.2.9:5173` with working authentication!