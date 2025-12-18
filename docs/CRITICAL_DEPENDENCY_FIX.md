# Critical Python 3.13 Dependency Fix

## The Issue
You're getting `KeyError: '__version__'` during wheel building, which indicates a corrupted pip cache or a specific malformed package. This is a common issue with Python 3.13 and certain packages.

## Immediate Solution Steps

### Step 1: Clean Slate Approach
```bash
# Deactivate your current virtual environment if active
deactivate

# Delete the current virtual environment
rmdir /s venv  # or use File Explorer to delete the venv folder

# Create a fresh virtual environment
python -m venv venv
venv\Scripts\activate

# Upgrade pip immediately
python -m pip install --upgrade pip setuptools wheel

# Clear pip cache
python -m pip cache purge
```

### Step 2: Install Minimal Requirements
```bash
python -m pip install -r requirements_minimal_safe.txt --no-cache-dir
```

### Step 3: Test Installation
```bash
python manage.py check
```

## If Step 1 Fails: Nuclear Option

### Remove Everything and Start Fresh
```bash
# Remove virtual environment completely
rmdir /s venv

# Clear pip cache manually
python -m pip cache purge

# Reinstall from scratch
python -m venv venv
venv\Scripts\activate
python -m pip install --upgrade pip setuptools wheel

# Install packages one by one
python -m pip install Django --no-cache-dir
python -m pip install djangorestframework --no-cache-dir
python -m pip install django-cors-headers --no-cache-dir
```

## Package-by-Package Installation

If the batch installation fails, install packages individually:

```bash
# Install core Django first
python -m pip install Django==4.2.7 --no-cache-dir

# Test Django works
python -c "import django; print('Django OK')"

# Add REST framework
python -m pip install djangorestframework==3.14.0 --no-cache-dir

# Add CORS support
python -m pip install django-cors-headers==4.3.1 --no-cache-dir
```

## Alternative: Use Conda (Recommended for Python 3.13)

```bash
# Install miniconda if not already installed
# Create conda environment
conda create -n offchat python=3.11
conda activate offchat
pip install Django djangorestframework django-cors-headers
```

## Automated Fix Script

Run the batch file I created:
```bash
fix_dependency_issues.bat
```

This script will:
1. Upgrade pip to latest
2. Clear pip cache
3. Remove potentially corrupted packages
4. Install essential packages only
5. Test Django installation

## Testing Your Setup

After installation, test your Django project:

```bash
python manage.py check
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Gradual Package Addition

Once basic Django is working, add packages slowly:

```bash
# Add development tools
pip install django-debug-toolbar

# Add testing framework
pip install pytest pytest-django

# Try problematic packages with specific flags
pip install Pillow --only-binary=all
pip install cryptography --only-binary=all
```

## Common Python 3.13 Issues

| Package | Status | Solution |
|---------|--------|----------|
| Django | ✅ Works | No issues |
| DRF | ✅ Works | No issues |
| Pillow | ❌ Issues | Use pre-built wheels only |
| cryptography | ❌ Issues | May need build tools |
| psycopg2 | ❌ Issues | Use SQLite for now |
| channels | ❌ Issues | Skip for now, add later |

## Next Steps After Fix

1. **Basic functionality**: Test chat interface with minimal dependencies
2. **Gradual enhancement**: Add image processing, WebSocket support later
3. **Consider Python version**: If issues persist, downgrade to Python 3.11/3.12
4. **Use conda**: More reliable for Python 3.13 compatibility

## Emergency Backup Plan

If nothing works:

1. Use Python 3.11 in a new virtual environment
2. Copy your project files to the new environment
3. Install from original requirements.txt
4. Your existing code will work fine

The key is to get a minimal Django installation working first, then build up gradually.