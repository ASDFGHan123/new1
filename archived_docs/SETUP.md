# OffChat Admin Dashboard - Setup Guide

## Quick Start (Automated)

### Windows
```bash
scripts\setup-dev.bat
```

This will:
1. Create a Python virtual environment
2. Install all Python dependencies
3. Create and run Django migrations
4. Install Node.js dependencies
5. Create a superuser account
6. Start both backend and frontend servers

### macOS/Linux
```bash
bash scripts/setup-dev.sh
```

## Manual Setup

### Prerequisites
- Python 3.9+
- Node.js 18.17.0 (see `.nvmrc`)
- Git

### Step-by-Step

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd offchat-admin-nexus-main
   ```

2. **Create Python virtual environment**
   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**
   - Windows: `venv\Scripts\activate.bat`
   - macOS/Linux: `source venv/bin/activate`

4. **Install Python dependencies**
   ```bash
   pip install --upgrade pip
   pip install -r requirements-dev.txt
   ```

5. **Create and run migrations**
   ```bash
   python manage.py makemigrations --settings=offchat_backend.settings.development
   python manage.py migrate --settings=offchat_backend.settings.development
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser --settings=offchat_backend.settings.development
   ```

7. **Install Node.js dependencies**
   ```bash
   npm ci
   ```

8. **Start development servers**
   - Terminal 1 (Backend):
     ```bash
     python manage.py runserver --settings=offchat_backend.settings.development
     ```
   - Terminal 2 (Frontend):
     ```bash
     npm run dev
     ```

## Starting Development (After Initial Setup)

### Windows
```bash
scripts\start-dev.bat
```

### macOS/Linux
```bash
bash scripts/start-dev.sh
```

## Virtual Environment Management

### Activate virtual environment
- Windows: `venv\Scripts\activate.bat`
- macOS/Linux: `source venv/bin/activate`

### Deactivate virtual environment
```bash
deactivate
```

### Remove virtual environment (clean slate)
```bash
rm -rf venv  # macOS/Linux
rmdir /s venv  # Windows
```

## Troubleshooting

### Virtual environment not activating
- Ensure you're in the project root directory
- Check that Python 3.9+ is installed: `python --version`

### Dependencies not installing
- Delete `venv` folder and recreate it
- Run `pip install --upgrade pip` before installing requirements

### Port already in use
- Backend (8000): `python manage.py runserver 8001`
- Frontend (5173): `npm run dev -- --port 5174`

### Database errors
- Delete `db.sqlite3` and re-run migrations
- Ensure migrations are created: `python manage.py makemigrations`

## Default Credentials

- **Username**: `admin`
- **Password**: `12341234`

## Project Structure

```
offchat-admin-nexus-main/
├── venv/                    # Python virtual environment (auto-created)
├── src/                     # React frontend
├── offchat_backend/         # Django backend
├── scripts/                 # Setup and start scripts
├── requirements.txt         # Production Python dependencies
├── requirements-dev.txt     # Development Python dependencies
├── package.json             # Node.js dependencies
├── package-lock.json        # Locked Node.js versions
├── .nvmrc                   # Node.js version specification
├── .python-version          # Python version specification
└── .gitignore               # Git ignore rules
```

## Notes

- The `venv` folder is automatically created and ignored by Git
- `npm ci` is used instead of `npm install` for exact dependency versions
- All dependencies are locked to specific versions for consistency
- Each device gets an isolated environment with no conflicts
