# OffChat Admin Nexus - Complete Setup Guide

## Quick Setup (Windows)

1. **Download/Clone the project** to your desired location
2. **Run the setup script**: Double-click `setup-dev.bat`
3. **Wait for completion** - The script handles everything automatically
4. **Start development**: Use `start-dev.bat` or individual scripts

## What the Setup Script Does

### Prerequisites Checked
- ✅ Python 3.8+ installation
- ✅ Node.js 18+ installation  
- ✅ Git installation

### Environment Setup
- ✅ Creates Python virtual environment (`venv\`)
- ✅ Installs all Python dependencies (`requirements.txt`)
- ✅ Installs development dependencies (`requirements-dev.txt`)
- ✅ Installs all Node.js dependencies (`package.json`)
- ✅ Sets up Django database with migrations
- ✅ Creates default admin user (admin/admin123)
- ✅ Configures environment variables (`.env.local`)
- ✅ Creates startup scripts

### Generated Files
- `start-backend.bat` - Starts Django backend server
- `start-frontend.bat` - Starts React frontend server
- `start-dev.bat` - Starts both servers
- `.env.local` - Environment configuration

## Manual Setup (If Script Fails)

### 1. Prerequisites
```bash
# Install Python 3.8+ from https://python.org
# Install Node.js 18+ from https://nodejs.org
# Install Git from https://git-scm.com
```

### 2. Python Environment
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install -r requirements-dev.txt
```

### 3. Django Setup
```bash
# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
# Username: admin
# Email: admin@offchat.local
# Password: admin123
```

### 4. Frontend Setup
```bash
# Install Node.js dependencies
npm install

# Create environment file
copy .env.example .env.local
# Edit .env.local and set VITE_API_URL=http://localhost:8000/api
```

## Development

### Starting the Application

#### Option 1: Use Startup Scripts
```bash
# Start both backend and frontend
start-dev.bat

# Or start individually
start-backend.bat    # Django backend
start-frontend.bat   # React frontend
```

#### Option 2: Manual Start
```bash
# Terminal 1 - Backend
venv\Scripts\activate
python manage.py runserver --settings=offchat_backend.settings.development

# Terminal 2 - Frontend  
npm run dev
```

### Access URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Django Admin**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/docs/

### Default Credentials
- **Username**: admin
- **Password**: admin123

## Project Structure

```
offchat-admin-nexus-main/
├── admin_panel/          # Django admin panel app
├── analytics/            # Analytics app
├── chat/                 # Chat functionality
├── users/                # User management
├── offchat_backend/      # Django settings
├── src/                  # React frontend source
├── media/                # User uploaded files
├── static/               # Static files
├── venv/                 # Python virtual environment
├── node_modules/         # Node.js dependencies
├── manage.py             # Django management script
├── requirements.txt      # Python dependencies
├── package.json          # Node.js dependencies
└── .env.local           # Environment variables
```

## Configuration

### Environment Variables (.env.local)
```env
# API Configuration
VITE_API_URL=http://localhost:8000/api

# Feature Flags
VITE_USE_REAL_DATA=true
VITE_ENABLE_WEBSOCKET=true

# Debug Mode
VITE_DEBUG=false
```

### LAN Access
For development on other devices in your network:

1. Find your IP address: `ipconfig`
2. Update `.env.local`: `VITE_API_URL=http://YOUR_IP:8000/api`
3. Update Django settings if needed (already allows all hosts in dev)

## Common Issues

### Python Issues
- **"Python not found"**: Install Python and add to PATH
- **"Virtual environment fails"**: Delete `venv\` folder and retry
- **"Module not found"**: Activate virtual environment first

### Node.js Issues  
- **"Node not found"**: Install Node.js and restart terminal
- **"npm install fails"**: Delete `node_modules\` and `package-lock.json`, retry
- **"Port in use"**: Change port in vite.config.ts or kill process

### Django Issues
- **"Migration errors"**: Delete `db.sqlite3` and re-migrate
- **"Permission denied"**: Run as administrator
- **"Server won't start"**: Check if port 8000 is in use

### Frontend Issues
- **"API connection failed"**: Check backend is running and API URL is correct
- **"CORS errors"**: Backend CORS settings should handle this in development
- **"Build fails"**: Check TypeScript errors and fix them

## Development Workflow

### 1. Making Changes
- **Backend**: Edit Django code, restart backend if needed
- **Frontend**: Edit React code, hot reload should work automatically

### 2. Database Changes
```bash
# Create new migration
python manage.py makemigrations

# Apply migration
python manage.py migrate
```

### 3. Testing
```bash
# Backend tests
python manage.py test

# Frontend tests
npm test
```

### 4. Linting
```bash
# Python linting (if configured)
flake8 .

# Frontend linting
npm run lint
npm run lint:fix
```

## Production Deployment

The setup script is for development only. For production:

1. Set `DEBUG=False` in production settings
2. Configure proper database (PostgreSQL recommended)
3. Set up static file serving
4. Configure domain and SSL
5. Set up Redis for caching/sessions
6. Configure Celery for background tasks

## Support

If you encounter issues:

1. Check this README for common solutions
2. Look at console output for error messages
3. Check Django logs: `django.log`
4. Verify all prerequisites are installed
5. Try running the setup script again

## Features

- **User Management**: Complete admin panel for user management
- **Real-time Chat**: WebSocket-based chat system
- **Analytics**: Comprehensive analytics dashboard
- **Backup System**: Automated backup creation and restoration
- **Role-based Access**: Granular permission system
- **Modern UI**: React-based responsive interface
- **API Documentation**: Auto-generated API docs

Enjoy developing with OffChat Admin Nexus! 🚀
