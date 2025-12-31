# LAN Network Configuration

## Overview
This project is configured to be accessible from other devices on your local network.

## Current Configuration

### Frontend (Vite)
- **Host**: 0.0.0.0 (all interfaces)
- **Port**: 5173
- **CORS**: Enabled for all origins in development

### Backend (Django)
- **Host**: 0.0.0.0 (all interfaces)
- **Port**: 8000
- **ALLOWED_HOSTS**: * (all hosts)
- **CORS**: Enabled for all origins in development

## How to Access from Other Devices

### Step 1: Find Your Machine's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (e.g., `192.168.1.100`)

**Mac/Linux:**
```bash
ifconfig
```

### Step 2: Access from Another Device

**Frontend Dashboard:**
```
http://<YOUR_IP>:5173
```

**Backend API:**
```
http://<YOUR_IP>:8000
```

**Django Admin:**
```
http://<YOUR_IP>:8000/admin
```

### Example
If your IP is `192.168.1.100`:
- Frontend: `http://192.168.1.100:5173`
- Backend: `http://192.168.1.100:8000`

## Firewall Configuration

### Windows Firewall
If you can't connect, allow the ports through Windows Firewall:

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Add Python (for Django) and Node.js (for Vite) to allowed apps
4. Or allow ports 5173 and 8000 specifically

### macOS/Linux
```bash
# Check if ports are open
sudo lsof -i :5173
sudo lsof -i :8000
```

## Production Considerations

For production deployment, update these settings:

### Backend (offchat_backend/settings/production.py)
```python
ALLOWED_HOSTS = ['yourdomain.com', 'www.yourdomain.com', 'your-ip-address']
CORS_ALLOWED_ORIGINS = ['https://yourdomain.com', 'https://www.yourdomain.com']
```

### Frontend (vite.config.ts)
For production, specify your domain instead of 0.0.0.0

## Troubleshooting

### Can't connect from another device?

1. **Check if servers are running:**
   ```bash
   # Frontend should show: VITE v5.x.x ready in xxx ms
   # Backend should show: Starting development server at http://127.0.0.1:8000/
   ```

2. **Verify IP address is correct:**
   ```bash
   ping <YOUR_IP>
   ```

3. **Check firewall settings** - Allow ports 5173 and 8000

4. **Ensure devices are on same network** - Both devices must be on the same WiFi/LAN

5. **Check Django ALLOWED_HOSTS** - In development, it's set to '*' which allows all

## Network Security Notes

⚠️ **Development Only**: The current configuration (`ALLOWED_HOSTS = ['*']`, `CORS_ALLOW_ALL_ORIGINS = True`) is suitable for development but NOT for production.

For production:
- Use specific domain names in ALLOWED_HOSTS
- Restrict CORS to specific origins
- Enable HTTPS/SSL
- Use environment-specific settings
