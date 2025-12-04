# Python 3.13 Dependency Installation Script
# This script attempts to resolve dependency installation issues for Python 3.13

Write-Host "🐍 Python 3.13 Dependency Installation Script" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check Python version
$pythonVersion = python --version
Write-Host "Detected Python version: $pythonVersion" -ForegroundColor Yellow

# Check if we're using Python 3.13
if ($pythonVersion -match "3\.13") {
    Write-Host "⚠️  Python 3.13 detected. Some packages may have compatibility issues." -ForegroundColor Yellow
    Write-Host "This script will try multiple approaches to install dependencies." -ForegroundColor Yellow
} else {
    Write-Host "✅ Using Python version other than 3.13" -ForegroundColor Green
}

Write-Host ""

# Function to try installing requirements
function Install-Requirements {
    param(
        [string]$RequirementsFile,
        [string]$Description
    )
    
    Write-Host "🔄 Trying to install: $Description" -ForegroundColor Cyan
    Write-Host "File: $RequirementsFile" -ForegroundColor Gray
    
    try {
        python -m pip install -r $RequirementsFile --no-cache-dir --verbose
        Write-Host "✅ Successfully installed: $Description" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to install: $Description" -ForegroundColor Red
        Write-Host "Error: $_" -ForegroundColor Red
        return $false
    }
}

# Function to install individual problematic packages
function Install-ProblematicPackages {
    Write-Host "🔄 Attempting to install problematic packages individually..." -ForegroundColor Cyan
    
    $packages = @(
        @{Name="Pillow"; Args="--only-binary=all"},
        @{Name="cryptography"; Args="--only-binary=all"},
        @{Name="psycopg2-binary"; Args="--only-binary=all"}
    )
    
    foreach ($pkg in $packages) {
        Write-Host "Installing $($pkg.Name)..." -ForegroundColor Yellow
        try {
            python -m pip install $pkg.Name $pkg.Args
            Write-Host "✅ $($pkg.Name) installed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Failed to install $($pkg.Name)" -ForegroundColor Red
            Write-Host "You may need to install Visual C++ Build Tools for compilation" -ForegroundColor Yellow
        }
    }
}

# Function to check Django installation
function Test-DjangoInstallation {
    Write-Host "🔍 Testing Django installation..." -ForegroundColor Cyan
    
    try {
        python -c "import django; print(f'Django version: {django.get_version()}')"
        python manage.py check
        Write-Host "✅ Django is working correctly!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Django installation has issues" -ForegroundColor Red
        return $false
    }
}

# Main installation logic
Write-Host "🚀 Starting dependency installation process..." -ForegroundColor Green
Write-Host ""

# Try 1: Install Python 3.13 compatible requirements
if (Test-Path "requirements_python313_compatible.txt") {
    $success = Install-Requirements "requirements_python313_compatible.txt" "Python 3.13 Compatible Requirements"
    
    if ($success) {
        Write-Host ""
        Write-Host "🎉 Basic installation successful!" -ForegroundColor Green
        
        # Test Django
        if (Test-DjangoInstallation) {
            Write-Host ""
            Write-Host "✨ Core Django functionality is working!" -ForegroundColor Green
            Write-Host "You can now try to add additional packages as needed." -ForegroundColor Cyan
            
            # Ask if user wants to try additional packages
            $response = Read-Host "Would you like to try installing additional packages? (y/n)"
            if ($response -eq 'y' -or $response -eq 'Y') {
                Install-ProblematicPackages
            }
        }
    }
} else {
    Write-Host "❌ requirements_python313_compatible.txt not found" -ForegroundColor Red
}

# Try 2: Fallback to minimal requirements
if (-not $success -and (Test-Path "requirements_minimal.txt")) {
    Write-Host ""
    Write-Host "🔄 Trying minimal requirements as fallback..." -ForegroundColor Yellow
    $success = Install-Requirements "requirements_minimal.txt" "Minimal Requirements"
}

# Try 3: Manual package installation
if (-not $success) {
    Write-Host ""
    Write-Host "🔄 Trying individual package installation..." -ForegroundColor Yellow
    
    $corePackages = @(
        "Django>=4.2,<5.0",
        "djangorestframework>=3.14.0",
        "django-cors-headers>=4.0.0",
        "python-decouple>=3.8",
        "python-dotenv>=1.0.0"
    )
    
    foreach ($package in $corePackages) {
        Write-Host "Installing $package..." -ForegroundColor Yellow
        try {
            python -m pip install $package --no-cache-dir
            Write-Host "✅ $package installed successfully" -ForegroundColor Green
        }
        catch {
            Write-Host "❌ Failed to install $package" -ForegroundColor Red
        }
    }
}

# Final status check
Write-Host ""
Write-Host "📋 Installation Summary" -ForegroundColor Green
Write-Host "======================" -ForegroundColor Green

if (Test-DjangoInstallation) {
    Write-Host "✅ Django installation is working!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Test your application: python manage.py runserver" -ForegroundColor White
    Write-Host "2. Add packages gradually as needed" -ForegroundColor White
    Write-Host "3. Check PYTHON313_DEPENDENCY_SOLUTION.md for detailed guidance" -ForegroundColor White
} else {
    Write-Host "❌ Django installation failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Suggested solutions:" -ForegroundColor Cyan
    Write-Host "1. Install Python 3.11 or 3.12 instead" -ForegroundColor White
    Write-Host "2. Use conda environment: conda create -n offchat python=3.11" -ForegroundColor White
    Write-Host "3. Install Visual C++ Build Tools if compilation is needed" -ForegroundColor White
    Write-Host "4. Check PYTHON313_DEPENDENCY_SOLUTION.md for detailed guidance" -ForegroundColor White
}

Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")