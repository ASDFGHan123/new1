# Download from GitHub & Setup

## Method 1: Download ZIP (Easiest)

1. **Go to GitHub Repository**
   ```
   https://github.com/YOUR_USERNAME/offchat-admin-nexus
   ```

2. **Download ZIP**
   - Click green "Code" button
   - Click "Download ZIP"
   - Extract to `C:\Projects\offchat-admin-nexus`

3. **Run Setup**
   ```cmd
   cd C:\Projects\offchat-admin-nexus
   scripts\setup-simple.bat
   ```

---

## Method 2: Git Clone (Recommended)

### Install Git First
1. Download from https://git-scm.com/download/win
2. Install with default settings

### Clone Repository
```cmd
cd C:\Projects
git clone https://github.com/YOUR_USERNAME/offchat-admin-nexus.git
cd offchat-admin-nexus
scripts\setup-simple.bat
```

---

## Method 3: GitHub Desktop (User-Friendly)

1. **Install GitHub Desktop**
   - Download from https://desktop.github.com/
   - Install and sign in

2. **Clone Repository**
   - Click "Clone a repository"
   - Enter: `YOUR_USERNAME/offchat-admin-nexus`
   - Choose local path: `C:\Projects\offchat-admin-nexus`
   - Click "Clone"

3. **Run Setup**
   ```cmd
   cd C:\Projects\offchat-admin-nexus
   scripts\setup-simple.bat
   ```

---

## Verify Download is Complete

After downloading, verify these files exist:

```cmd
cd offchat-admin-nexus
dir frontend\src\lib\api.ts
dir frontend\src\lib\utils.ts
dir frontend\src\lib\websocket.ts
dir backend\requirements.txt
dir scripts\setup-simple.bat
```

All should show "1 File(s)" - if not, re-download.

---

## Common Download Issues

### Issue: Missing .ts files
**Cause**: Downloaded from "Releases" instead of source code
**Fix**: Download from main branch, not releases

### Issue: Only .js files present
**Cause**: Downloaded built/compiled version
**Fix**: Download source code (green "Code" button → Download ZIP)

### Issue: Incomplete download
**Cause**: Network interruption
**Fix**: Delete folder and download again

---

## After Download Checklist

✅ All files present (check above)
✅ Python 3.8+ installed
✅ Node.js 18+ installed
✅ Run `scripts\setup-simple.bat`
✅ Access http://localhost:5173

---

## Push to Your Own GitHub

If you want to host it on your GitHub:

```cmd
cd offchat-admin-nexus

REM Initialize git (if not already)
git init

REM Add all files
git add .

REM Commit
git commit -m "Initial commit"

REM Add your GitHub repo
git remote add origin https://github.com/YOUR_USERNAME/offchat-admin-nexus.git

REM Push
git push -u origin main
```

---

## Update from GitHub

To get latest changes:

```cmd
cd offchat-admin-nexus
git pull origin main
scripts\setup-simple.bat
```

---

## That's It!

Download → Extract → Run `scripts\setup-simple.bat` → Done!
