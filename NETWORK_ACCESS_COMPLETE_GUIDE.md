# OffChat App - Network Access Complete Guide

## Current Configuration Status

Your OffChat application is **already configured** for network access from other devices!

### Your Network Setup
- **Your IP Address**: `192.168.2.9`
- **Frontend (React)**: `http://192.168.2.9:5173`
- **Backend (Django)**: `http://192.168.2.9:8000`
- **Django Admin Panel**: `http://192.168.2.9:8000/admin`

## How to Start Your App

### Method 1: Full Project Starter (Recommended)
```powershell
# Start both Django and React servers
.\start_project.ps1
```

This will:
- Start Django backend server on `0.0.0.0:8000` (accessible from all network interfaces)
- Start React frontend server on port 5173 (accessible from all network interfaces)
- Display all access URLs in the console
- Handle any port conflicts automatically

### Method 2: Individual Server Starters
```powershell
# Terminal 1: Start Django Backend
.\start_django.ps1

# Terminal 2: Start React Frontend
.\start_react.ps1
```

## Accessing from Other Devices

### Step 1: Ensure Devices are on Same Network
- Make sure both your computer and the other device(s) are connected to the same WiFi network
- Your current network: `192.168.2.9/24`

### Step 2: From Other Devices, Access the App

**Primary Access Point:**
```
http://192.168.2.9:5173
```

**Alternative Access Points:**
- **Direct Backend Access**: `http://192.168.2.9:8000`
- **Django Admin Panel**: `http://192.168.2.9:8000/admin`
- **API Documentation**: `http://192.168.2.9:8000/api/`

### Step 3: Login Credentials
```
Username: admin
Password: 12341234
```

## What Configuration Enables Network Access

### 1. Django Settings (`offchat_backend/settings.py`)
```python
# ALLOWED_HOSTS includes your network IP
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '192.168.2.9', 'testserver']

# CORS configuration allows network access
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://192.168.2.9:5173",  # This enables external access
    # ... other origins
]
```

### 2. Server Binding (`start_django.ps1`)
```powershell
# Django server binds to all network interfaces
python manage.py runserver 0.0.0.0:8000
```

### 3. Dynamic API URL (`src/lib/api.ts`)
```typescript
// Auto-detects network vs local access
private getApiBaseUrl(): string {
    const hostname = window.location.hostname;
    const port = '8000';
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `http://localhost:${port}/api`;
    }
    
    // For network access, uses current host
    return `http://${hostname}:${port}/api`;
}
```

### 4. React Dev Server Configuration
- Vite development server automatically binds to all interfaces when started via `npm run dev`

## Network Access Verification

To verify network access is working:

### 1. Check Port Availability
```powershell
# Check if ports are listening
netstat -an | findstr "5173"
netstat -an | findstr "8000"
```

### 2. Test Local Access First
- Visit: `http://localhost:5173`
- Visit: `http://localhost:8000`

### 3. Test Network Access from Same Machine
- Visit: `http://192.168.2.9:5173`
- Visit: `http://192.168.2.9:8000`

### 4. Test from Other Devices
- Visit: `http://192.168.2.9:5173` from any device on the same network

## Troubleshooting

### If External Devices Can't Connect

#### 1. Firewall Issues
- **Windows Defender Firewall** may be blocking connections
- **Solution**: Allow Node.js and Python through firewall for ports 5173 and 8000

#### 2. Router/AP Isolation
- Some WiFi routers have "AP Isolation" or "Client Isolation" enabled
- **Solution**: Check router settings or use a different network

#### 3. Different IP Address
- If your IP changes, update the configuration:
```powershell
# Check current IP
ipconfig

# Update these files if needed:
# - offchat_backend/settings.py (ALLOWED_HOSTS)
# - offchat_backend/settings.py (CORS_ALLOWED_ORIGINS)
```

#### 4. Antivirus Software
- Some antivirus programs block local network servers
- **Solution**: Add exceptions for Node.js and Python

### If Authentication Fails from Network
- Ensure users are marked as "active" in Django admin
- Check that the network IP is in ALLOWED_HOSTS
- Verify CORS configuration includes the network URL

## Quick Commands Reference

```powershell
# Start everything
.\start_project.ps1

# Start just Django
.\start_django.ps1

# Start just React
.\start_react.ps1

# Check current IP
ipconfig

# Check if ports are in use
netstat -an | findstr "5173"
netstat -an | findstr "8000"

# Kill processes on specific ports
netstat -ano | findstr "5173"  # Get PID
taskkill /PID <PID> /F

# Alternative: Use PowerShell to kill processes
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess -Force
```

## Security Notes

⚠️ **Important**: This configuration is for **development and testing only**

For production:
- Use HTTPS instead of HTTP
- Implement proper authentication and authorization
- Use environment-specific configurations
- Consider using a reverse proxy (nginx)
- Implement proper SSL/TLS certificates

## Expected Behavior

### When Everything Works:
1. ✅ **Local Access**: `http://localhost:5173` works on your machine
2. ✅ **Network Access**: `http://192.168.2.9:5173` works on your machine
3. ✅ **External Access**: `http://192.168.2.9:5173` works on other devices
4. ✅ **Authentication**: Login works from both local and external devices
5. ✅ **API Calls**: All backend functionality works from external devices

### Access Points Summary:

| Component | Local Access | Network Access | External Access |
|-----------|-------------|----------------|-----------------|
| **React Frontend** | `http://localhost:5173` | `http://192.168.2.9:5173` | `http://192.168.2.9:5173` |
| **Django Backend** | `http://localhost:8000` | `http://192.168.2.9:8000` | `http://192.168.2.9:8000` |
| **Django Admin** | `http://localhost:8000/admin` | `http://192.168.2.9:8000/admin` | `http://192.168.2.9:8000/admin` |
| **API Endpoints** | `http://localhost:8000/api/` | `http://192.168.2.9:8000/api/` | `http://192.168.2.9:8000/api/` |

## Ready to Use!

Your OffChat application is **ready for network access**. Simply:

1. Run `.\start_project.ps1`
2. Share `http://192.168.2.9:5173` with other devices
3. Login with `admin` / `12341234`

The configuration automatically handles the network detection and API routing!