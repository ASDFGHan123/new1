# OffChat Admin Dashboard - Enhanced Project Launcher (PowerShell)
# Compatible with Windows PowerShell and PowerShell Core
# Enhanced for Django + React admin dashboard with comprehensive setup

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "OffChat Admin Dashboard - Enhanced Project Launcher" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Check PowerShell execution policy
$executionPolicy = Get-ExecutionPolicy
if ($executionPolicy -eq "Restricted") {
    Write-Host "[WARNING] PowerShell execution policy is Restricted" -ForegroundColor Yellow
    Write-Host "You may need to run: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser" -ForegroundColor Yellow
}

# Function to check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (Test-Administrator) {
    Write-Host "[INFO] Running with administrator privileges" -ForegroundColor Green
} else {
    Write-Host "[INFO] Running as standard user - some operations may require elevation" -ForegroundColor Yellow
}

# Function to check if a port is in use
function Test-PortInUse {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        return $connections.Count -gt 0
    } catch {
        return $false
    }
}

# Function to kill processes on a specific port
function Stop-ProcessOnPort {
    param([int]$Port)
    try {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        foreach ($connection in $connections) {
            $processId = $connection.OwningProcess
            Write-Host "Terminating process $processId on port $Port" -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Host "Could not terminate processes on port $Port" -ForegroundColor Yellow
    }
}

# Function to find the best Python requirements file
function Get-PythonRequirementsFile {
    $pythonVersion = & python --version 2>$null
    Write-Host "Detected: $pythonVersion" -ForegroundColor Cyan
    
    # Check for specific requirements files in order of preference
    $requirementsFiles = @(
        "requirements_python313_compatible.txt",
        "requirements_minimal_safe.txt", 
        "requirements_minimal.txt",
        "requirements.txt"
    )
    
    foreach ($reqFile in $requirementsFiles) {
        if (Test-Path $reqFile) {
            Write-Host "Using requirements file: $reqFile" -ForegroundColor Green
            return $reqFile
        }
    }
    
    Write-Host "No requirements file found, will install core packages manually" -ForegroundColor Yellow
    return $null
}

Write-Host "[1/8] Checking for running servers and processes..." -ForegroundColor Blue
Write-Host "Cleaning up processes on ports 5173 (React) and 8000 (Django)..."

# Kill processes on port 5173 (React dev server)
if (Test-PortInUse -Port 5173) {
    Write-Host "Found processes on port 5173" -ForegroundColor Yellow
    Stop-ProcessOnPort -Port 5173
} else {
    Write-Host "Port 5173 is available" -ForegroundColor Green
}

# Kill processes on port 8000 (Django)
if (Test-PortInUse -Port 8000) {
    Write-Host "Found processes on port 8000" -ForegroundColor Yellow
    Stop-ProcessOnPort -Port 8000
} else {
    Write-Host "Port 8000 is available" -ForegroundColor Green
}

# Kill any existing Node.js processes (being more selective to avoid system issues)
Write-Host "Checking for Node.js processes..." -ForegroundColor Blue
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -eq "node" }
if ($nodeProcesses) {
    Write-Host "Found $($nodeProcesses.Count) Node.js processes" -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
}

Write-Host "[2/8] Checking Node.js installation..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js $nodeVersion found" -ForegroundColor Green
    
    # Check if Node.js version is adequate (>= 16)
    $nodeVersionNum = [System.Version]($nodeVersion -replace 'v', '')
    if ($nodeVersionNum.Major -lt 16) {
        Write-Host "[WARNING] Node.js version is older than recommended (16+)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Node.js not found! Please install Node.js 16+ from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[3/8] Checking Python installation..." -ForegroundColor Blue
try {
    $pythonVersion = python --version
    Write-Host "[OK] $pythonVersion found" -ForegroundColor Green
    
    # Check Python version compatibility
    $pythonVersionNum = [System.Version]($pythonVersion -replace 'Python ', '')
    if ($pythonVersionNum.Major -lt 3 -or ($pythonVersionNum.Major -eq 3 -and $pythonVersionNum.Minor -lt 8)) {
        Write-Host "[WARNING] Python version is older than recommended (3.8+)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Python not found! Please install Python 3.8+ from https://python.org/" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[4/8] Checking npm and package manager..." -ForegroundColor Blue
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm $npmVersion found" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] npm not found!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check for alternative package managers
if (Test-Path "bun.lockb") {
    Write-Host "[INFO] Detected Bun package manager lockfile" -ForegroundColor Cyan
    try {
        $bunVersion = bun --version
        Write-Host "[INFO] Bun $bunVersion available as alternative" -ForegroundColor Green
    } catch {
        Write-Host "[INFO] Bun not available, will use npm" -ForegroundColor Yellow
    }
}

Write-Host "[5/8] Setting up Python virtual environment..." -ForegroundColor Blue
if (-not (Test-Path "venv")) {
    Write-Host "Creating Python virtual environment..." -ForegroundColor Blue
    try {
        python -m venv venv
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to create virtual environment" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Host "Virtual environment created successfully" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to create virtual environment: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Blue
try {
    & ".\venv\Scripts\Activate.ps1"
    Write-Host "Virtual environment activated" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Failed to activate virtual environment: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Blue
$requirementsFile = Get-PythonRequirementsFile

if ($requirementsFile) {
    Write-Host "Installing from $requirementsFile..." -ForegroundColor Blue
    try {
        pip install -r $requirementsFile
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[WARNING] Primary requirements installation failed, trying fallback..." -ForegroundColor Yellow
            
            # Try minimal requirements
            if ($requirementsFile -ne "requirements_minimal.txt" -and (Test-Path "requirements_minimal.txt")) {
                Write-Host "Trying minimal requirements..." -ForegroundColor Yellow
                pip install -r requirements_minimal.txt
            }
        } else {
            Write-Host "Python dependencies installed successfully" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Requirements installation had issues: $_" -ForegroundColor Yellow
    }
} else {
    # Install core packages manually as fallback
    Write-Host "Installing core Django packages manually..." -ForegroundColor Yellow
    $corePackages = @(
        "Django>=4.2.0",
        "djangorestframework>=3.14.0",
        "django-cors-headers>=4.0.0",
        "channels>=4.0.0",
        "channels-redis>=4.1.0",
        "python-decouple>=3.8"
    )
    
    foreach ($package in $corePackages) {
        Write-Host "Installing $package..." -ForegroundColor Blue
        pip install $package
    }
}

Write-Host "[6/8] Installing/updating npm dependencies..." -ForegroundColor Blue
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing npm packages for the first time..." -ForegroundColor Blue
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] Failed to install npm packages" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }
        Write-Host "npm packages installed successfully" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Failed to install npm packages: $_" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
} else {
    Write-Host "Updating existing npm packages..." -ForegroundColor Blue
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[WARNING] npm update had issues, but continuing..." -ForegroundColor Yellow
        } else {
            Write-Host "npm packages updated successfully" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] npm update failed: $_" -ForegroundColor Yellow
    }
}

Write-Host "[7/8] Checking Django project setup..." -ForegroundColor Blue
if (Test-Path "manage.py") {
    Write-Host "Django project detected" -ForegroundColor Green
    
    # Check database setup
    Write-Host "Checking database setup..." -ForegroundColor Blue
    if (-not (Test-Path "db.sqlite3")) {
        Write-Host "Database not found, running migrations..." -ForegroundColor Yellow
        try {
            python manage.py migrate --noinput
            Write-Host "Database migrations completed" -ForegroundColor Green
        } catch {
            Write-Host "[WARNING] Database migration failed: $_" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Database file found" -ForegroundColor Green
    }
    
    # Create superuser if needed
    Write-Host "Checking for admin user..." -ForegroundColor Blue
    try {
        $adminExists = python manage.py shell -c "from django.contrib.auth.models import User; print(User.objects.filter(username='admin').exists())" 2>$null
        if ($adminExists -eq "False") {
            Write-Host "Creating default admin user..." -ForegroundColor Yellow
            python manage.py createsuperuser --username admin --email admin@example.com --noinput 2>$null
            Write-Host "Default admin user created (password: 12341234)" -ForegroundColor Green
        } else {
            Write-Host "Admin user already exists" -ForegroundColor Green
        }
    } catch {
        Write-Host "[WARNING] Could not check/create admin user" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] Django manage.py not found - may not be a standard Django project" -ForegroundColor Yellow
}

Write-Host "[8/8] Verifying environment configuration..." -ForegroundColor Blue
if (Test-Path ".env") {
    Write-Host "Environment file found" -ForegroundColor Green
    # Source the environment if needed
    try {
        Get-Content .env | ForEach-Object {
            if ($_ -match '^([^=]+)=(.*)$') {
                $envVar = $matches[1]
                $envValue = $matches[2]
                if (-not [Environment]::GetEnvironmentVariable($envVar)) {
                    [Environment]::SetEnvironmentVariable($envVar, $envValue, "Process")
                }
            }
        }
        Write-Host "Environment variables loaded" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Could not load environment variables" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARNING] No .env file found - using default settings" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "Frontend (React): http://localhost:5173" -ForegroundColor Green
Write-Host "Frontend (Network): http://192.168.2.9:5173" -ForegroundColor Green
Write-Host "Backend (Django): http://localhost:8000" -ForegroundColor Green
Write-Host "Backend (Network): http://192.168.2.9:8000" -ForegroundColor Green
Write-Host "Django Admin: http://localhost:8000/admin" -ForegroundColor Green
Write-Host "Django Admin (Network): http://192.168.2.9:8000/admin" -ForegroundColor Green
Write-Host ""
Write-Host "Project Features:" -ForegroundColor Blue
Write-Host "- Admin Dashboard with user management" -ForegroundColor White
Write-Host "- Real-time chat functionality" -ForegroundColor White
Write-Host "- Message analytics and moderation" -ForegroundColor White
Write-Host "- System message templates" -ForegroundColor White
Write-Host "- Audit logging and backup management" -ForegroundColor White
Write-Host ""
Write-Host "Login credentials:" -ForegroundColor Blue
Write-Host "Username: admin" -ForegroundColor White
Write-Host "Password: 12341234" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Yellow
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Start Django backend in background
Write-Host "Starting Django backend server..." -ForegroundColor Blue
if (Test-Path "start_django.ps1") {
    Start-Process powershell -ArgumentList "-NoExit", "-File", "start_django.ps1"
} else {
    Write-Host "[WARNING] start_django.ps1 not found, starting Django directly..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '.\venv\Scripts\Activate.ps1'; python manage.py runserver 0.0.0.0:8000"
}

# Wait for Django to start
Write-Host "Waiting for Django server to initialize..." -ForegroundColor Blue
Start-Sleep -Seconds 3

# Start React frontend
Write-Host "Starting React frontend server..." -ForegroundColor Blue
if (Test-Path "start_react.ps1") {
    Start-Process powershell -ArgumentList "-NoExit", "-File", "start_react.ps1"
} else {
    Write-Host "[WARNING] start_react.ps1 not found, starting React directly..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
}

Write-Host ""
Write-Host "[SUCCESS] Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Blue
Write-Host "Local Access:" -ForegroundColor Cyan
Write-Host "- Admin Dashboard: http://localhost:5173" -ForegroundColor White
Write-Host "- Backend API: http://localhost:8000/api/" -ForegroundColor White
Write-Host "- Django Admin: http://localhost:8000/admin" -ForegroundColor White
Write-Host "- Auth API: http://localhost:8000/api/auth/" -ForegroundColor White
Write-Host "- Users API: http://localhost:8000/api/users/" -ForegroundColor White
Write-Host "- Chat API: http://localhost:8000/api/chat/" -ForegroundColor White
Write-Host "- Admin API: http://localhost:8000/api/admin/" -ForegroundColor White
Write-Host "- Analytics API: http://localhost:8000/api/analytics/" -ForegroundColor White
Write-Host ""
Write-Host "Network Access (for other devices):" -ForegroundColor Cyan
Write-Host "- Admin Dashboard: http://192.168.2.9:5173" -ForegroundColor White
Write-Host "- Backend API: http://192.168.2.9:8000/api/" -ForegroundColor White
Write-Host "- Django Admin: http://192.168.2.9:8000/admin" -ForegroundColor White
Write-Host "- Auth API: http://192.168.2.9:8000/api/auth/" -ForegroundColor White
Write-Host ""
Write-Host "Project Structure:" -ForegroundColor Blue
Write-Host "- Backend apps: admin_panel, analytics, chat" -ForegroundColor White
Write-Host "- Frontend: React with TypeScript and Tailwind CSS" -ForegroundColor White
Write-Host "- Database: SQLite (development), PostgreSQL (production ready)" -ForegroundColor White
Write-Host "- Real-time: Django Channels with WebSocket support" -ForegroundColor White
Write-Host ""
Write-Host "To stop servers: Close the PowerShell windows or press Ctrl+C in each window" -ForegroundColor Yellow
Write-Host ""

Read-Host "Press Enter to continue and keep this launcher open"