# Emergency Dependency Fix for Python 3.13
# This script aggressively cleans and rebuilds the environment

Write-Host "🚨 EMERGENCY PYTHON 3.13 DEPENDENCY FIX" -ForegroundColor Red
Write-Host "=======================================" -ForegroundColor Red

# Check current directory
Write-Host "📍 Current directory: $(Get-Location)" -ForegroundColor Yellow

# Check Python version
$pythonVersion = python --version
Write-Host "🐍 Python version: $pythonVersion" -ForegroundColor Yellow

# Step 1: Deactivate virtual environment if active
Write-Host "`n📤 Deactivating any active virtual environment..." -ForegroundColor Cyan
if ($env:VIRTUAL_ENV) {
    Write-Host "Deactivating virtual environment: $($env:VIRTUAL_ENV)" -ForegroundColor Yellow
    deactivate 2>$null
}

# Step 2: Remove existing virtual environment completely
Write-Host "`n🗑️ Removing existing virtual environment..." -ForegroundColor Red
if (Test-Path "venv") {
    Write-Host "Deleting venv directory..." -ForegroundColor Yellow
    try {
        Remove-Item -Path "venv" -Recurse -Force
        Write-Host "✅ Virtual environment deleted" -ForegroundColor Green
    } catch {
        Write-Host "❌ Could not delete venv directory. Try manually deleting it." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ No existing venv found" -ForegroundColor Green
}

# Step 3: Clear pip cache completely
Write-Host "`n🧹 Clearing pip cache..." -ForegroundColor Cyan
try {
    python -m pip cache purge
    Write-Host "✅ Pip cache cleared" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not clear pip cache, continuing..." -ForegroundColor Yellow
}

# Step 4: Upgrade pip, setuptools, wheel
Write-Host "`n⬆️ Upgrading pip, setuptools, wheel..." -ForegroundColor Cyan
try {
    python -m pip install --upgrade pip setuptools wheel --no-cache-dir
    Write-Host "✅ Upgrade completed" -ForegroundColor Green
} catch {
    Write-Host "❌ Upgrade failed" -ForegroundColor Red
    Write-Host "Trying with force-reinstall..." -ForegroundColor Yellow
    python -m pip install --force-reinstall --upgrade pip setuptools wheel --no-cache-dir
}

# Step 5: Create fresh virtual environment
Write-Host "`n🏗️ Creating fresh virtual environment..." -ForegroundColor Cyan
try {
    python -m venv venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
    exit 1
}

# Step 6: Activate virtual environment
Write-Host "`n⚡ Activating virtual environment..." -ForegroundColor Cyan
try {
    & "venv\Scripts\Activate.ps1"
    Write-Host "✅ Virtual environment activated" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not activate with PowerShell, trying batch..." -ForegroundColor Yellow
    cmd /c "venv\Scripts\activate.bat && echo Activated"
}

# Step 7: Verify activation
Write-Host "`n🔍 Verifying virtual environment..." -ForegroundColor Cyan
$currentPython = python --version
Write-Host "Current Python: $currentPython" -ForegroundColor Yellow

# Step 8: Install minimal requirements
Write-Host "`n📦 Installing minimal requirements..." -ForegroundColor Cyan

if (Test-Path "requirements_minimal_safe.txt") {
    Write-Host "Using requirements_minimal_safe.txt" -ForegroundColor Yellow
    try {
        python -m pip install -r requirements_minimal_safe.txt --no-cache-dir --verbose
        Write-Host "✅ Minimal requirements installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install from requirements file" -ForegroundColor Red
        Write-Host "`n🔄 Trying individual packages..." -ForegroundColor Yellow
        
        # Try individual packages
        $packages = @(
            "Django>=4.2,<5.0",
            "djangorestframework>=3.14.0", 
            "django-cors-headers>=4.0.0",
            "python-decouple>=3.8",
            "requests>=2.31.0",
            "pytz>=2023.3"
        )
        
        foreach ($pkg in $packages) {
            Write-Host "Installing $pkg..." -ForegroundColor Yellow
            try {
                python -m pip install $pkg --no-cache-dir
                Write-Host "✅ $pkg installed successfully" -ForegroundColor Green
            } catch {
                Write-Host "❌ Failed to install $pkg" -ForegroundColor Red
            }
        }
    }
} else {
    Write-Host "❌ requirements_minimal_safe.txt not found" -ForegroundColor Red
}

# Step 9: Test Django installation
Write-Host "`n🧪 Testing Django installation..." -ForegroundColor Cyan
try {
    $djangoVersion = python -c "import django; print(django.get_version())"
    Write-Host "✅ Django version: $djangoVersion" -ForegroundColor Green
    
    # Test Django project
    python manage.py check
    Write-Host "✅ Django project check passed!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Django installation test failed" -ForegroundColor Red
}

# Final summary
Write-Host "`n📋 FINAL STATUS" -ForegroundColor Green
Write-Host "===============" -ForegroundColor Green

try {
    python -c "import django, rest_framework; print('✅ Django and DRF working')"
    Write-Host "🎉 SUCCESS: Core Django functionality is working!" -ForegroundColor Green
    
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Test your application: python manage.py runserver" -ForegroundColor White
    Write-Host "2. Gradually add additional packages as needed" -ForegroundColor White
    Write-Host "3. For problematic packages, use --only-binary=all flag" -ForegroundColor White
    
} catch {
    Write-Host "❌ FAILURE: Django installation still has issues" -ForegroundColor Red
    
    Write-Host "`nSuggested actions:" -ForegroundColor Cyan
    Write-Host "1. Use Python 3.11 instead: conda create -n offchat python=3.11" -ForegroundColor White
    Write-Host "2. Check CRITICAL_DEPENDENCY_FIX.md for detailed steps" -ForegroundColor White
    Write-Host "3. Try on a different machine with stable Python version" -ForegroundColor White
}

Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")