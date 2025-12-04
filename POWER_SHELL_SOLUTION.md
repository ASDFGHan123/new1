# PowerShell Solution for OffChat Admin Dashboard

## Issue Resolved
The original `.bat` files had compatibility issues when run from PowerShell. I've created PowerShell-compatible scripts (`.ps1` files) that work seamlessly with PowerShell.

## 🚀 How to Run (PowerShell)

### Method 1: Use PowerShell Scripts (Recommended)
```powershell
# 1. Set execution policy (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# 2. Run the main launcher script
.\start_project.ps1
```

### Method 2: Use Command Prompt
```cmd
# If you prefer using Command Prompt instead of PowerShell:
start_project.bat
```

## 📁 Available Scripts

### PowerShell Scripts (.ps1)
- `start_project.ps1` - Complete project launcher (PowerShell compatible)
- `start_django.ps1` - Django backend server starter
- `start_react.ps1` - React frontend server starter

### Batch Scripts (.bat)
- `start_project.bat` - Complete project launcher (Command Prompt)
- `stop_servers.bat` - Stop all servers
- `check_status.bat` - Check server status

## 🔧 Quick Start Instructions

1. **Open PowerShell as Administrator** (recommended)
   - Right-click PowerShell → "Run as Administrator"

2. **Navigate to project directory**
   ```powershell
   cd "C:\Users\salaam\Desktop\offchat-admin-nexus-main"
   ```

3. **Set execution policy** (if needed)
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **Run the launcher**
   ```powershell
   .\start_project.ps1
   ```

## ✅ What's Fixed

- ✅ PowerShell-compatible syntax
- ✅ Better process management using PowerShell cmdlets
- ✅ Proper error handling for PowerShell environment
- ✅ Automatic dependency checking
- ✅ Smart port conflict resolution
- ✅ Virtual environment handling

## 🎯 Expected Results

After running `start_project.ps1`, you should see:
- Django backend starting on http://localhost:8000
- React frontend starting on http://localhost:5173
- Two separate PowerShell windows for each server
- Success messages indicating servers are running

## 🌐 Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Django Admin**: http://localhost:8000/admin

**Login**: admin / 12341234

## 🛠️ Troubleshooting

### "Execution policy" error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### "Script cannot be loaded" error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port already in use
The script will automatically kill existing processes on ports 5173 and 8000.

### Permission errors
- Run PowerShell as Administrator
- Or use the Command Prompt version (`start_project.bat`)

## 📊 Status Check

To check current server status:
```powershell
# Check if ports are in use
netstat -ano | findstr :5173
netstat -ano | findstr :8000

# Or use the batch file
.\check_status.bat
```

## 🛑 Stopping Servers

To stop all servers:
```powershell
# Close the PowerShell windows manually
# Or run the stop script
.\stop_servers.bat
```

The PowerShell solution provides better integration with Windows and more reliable process management.