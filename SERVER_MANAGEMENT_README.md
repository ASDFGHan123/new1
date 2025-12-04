# OffChat Admin Dashboard - Server Management Scripts

This directory contains Windows batch scripts to help you manage the OffChat Admin Dashboard project servers.

## 🚀 Quick Start Scripts

### 1. `start_project.bat` - Complete Setup & Start
**Purpose**: Checks all dependencies, installs requirements, and starts both frontend and backend servers.

**What it does**:
- ✅ Checks for existing servers and kills them if needed
- ✅ Verifies Node.js, Python, and npm installations
- ✅ Creates Python virtual environment if needed
- ✅ Installs npm dependencies
- ✅ Installs Python dependencies from requirements.txt
- ✅ Starts Django backend server (port 8000)
- ✅ Starts React frontend server (port 5173)
- ✅ Opens servers in separate command windows

**Usage**:
```bash
# Double-click the file or run from command prompt:
start_project.bat
```

**Access Points after starting**:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api/
- Django Admin: http://localhost:8000/admin

**Default Login**: admin / 12341234

---

### 2. `stop_servers.bat` - Stop All Servers
**Purpose**: Stops all servers and related processes on ports 5173 and 8000.

**What it does**:
- 🔍 Shows which servers are currently running
- 🛑 Kills processes on port 5173 (React)
- 🛑 Kills processes on port 8000 (Django)
- 🛑 Terminates all Node.js processes
- 🛑 Asks before killing Python processes (safety feature)
- ✅ Verifies ports are now free

**Usage**:
```bash
# Double-click the file or run from command prompt:
stop_servers.bat
```

**Safety Features**:
- Shows current running processes before stopping
- Asks for confirmation before killing all Python processes
- Verifies successful termination

---

### 3. `check_status.bat` - System Status Check
**Purpose**: Check the current status of servers and dependencies without making changes.

**What it does**:
- 📊 Shows Node.js, Python, npm, and Redis installation status
- 📊 Lists running servers on ports 5173 and 8000
- 📊 Shows process IDs for active servers
- 📊 Checks for required project files
- 📊 Verifies virtual environment and node_modules
- 📊 Shows available access points

**Usage**:
```bash
# Double-click the file or run from command prompt:
check_status.bat
```

---

## 🔧 Prerequisites

Before using these scripts, ensure you have installed:

### Required Software
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **Python 3.8+** - Download from [python.org](https://python.org/)
- **npm** (comes with Node.js)

### Optional Software
- **Redis** - For WebSocket features (download from [redis.io](https://redis.io/))

### System Requirements
- **Windows 10/11** (scripts are designed for Windows)
- **Administrator privileges** (recommended for process management)

---

## 🚨 Troubleshooting

### Common Issues

#### "Node.js not found"
- Install Node.js 18+ from [nodejs.org](https://nodejs.org/)
- Restart command prompt after installation
- Verify with `node --version` in terminal

#### "Python not found"
- Install Python 3.8+ from [python.org](https://python.org/)
- Check "Add Python to PATH" during installation
- Restart command prompt after installation

#### "Port already in use"
- Run `stop_servers.bat` to kill existing processes
- Or manually stop processes using Task Manager
- Check port usage with `netstat -ano | findstr :5173`

#### "Permission denied"
- Run command prompt as Administrator
- Or right-click batch files → "Run as administrator"

#### "Failed to install dependencies"
- Check internet connection
- Run `stop_servers.bat` first
- Delete `node_modules` folder and try again
- For Python issues, manually run `pip install -r requirements.txt`

---

## 🎯 Usage Workflows

### Starting Fresh
```bash
# 1. Check current status
check_status.bat

# 2. Stop any existing servers
stop_servers.bat

# 3. Start everything
start_project.bat
```

### Development Session
```bash
# Start servers for development
start_project.bat

# Keep developing... servers run in background

# When done, stop servers
stop_servers.bat
```

### Quick Status Check
```bash
# See what's running
check_status.bat
```

---

## 📱 Access Points Reference

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | React admin dashboard |
| **Backend API** | http://localhost:8000/api/ | Django REST API |
| **Django Admin** | http://localhost:8000/admin | Django admin interface |
| **WebSocket** | ws://localhost:8000/ws/ | Real-time chat |

### Default Credentials
- **Username**: `admin`
- **Password**: `12341234`

---

## 🛡️ Safety Features

### Process Management
- Scripts automatically detect and kill conflicting processes
- Confirmation prompts for destructive operations
- Process ID tracking for precise control

### Error Handling
- Comprehensive error checking at each step
- User-friendly error messages with solutions
- Fallback options when optional components fail

### Dependency Verification
- Checks all required software before starting
- Clear installation instructions for missing components
- Version compatibility verification

---

## 🔍 Advanced Usage

### Manual Process Control
```bash
# Check specific port
netstat -ano | findstr :5173

# Kill specific process by ID
taskkill /PID 12345 /F

# List all Node processes
tasklist | findstr node

# List all Python processes  
tasklist | findstr python
```

### Script Customization
All scripts can be edited to:
- Change port numbers
- Modify startup commands
- Add additional dependencies
- Customize error messages

---

## 📞 Support

If you encounter issues:

1. **Check status first**: Run `check_status.bat`
2. **Try stopping and starting**: Run `stop_servers.bat` then `start_project.bat`
3. **Check logs**: Look in command windows for error messages
4. **Verify prerequisites**: Ensure Node.js and Python are installed
5. **Run as Administrator**: Right-click → "Run as administrator"

For development issues, check the main project README.md for detailed documentation.