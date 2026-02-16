# Complete GitHub Setup Guide

## Prerequisites
- Git installed: https://git-scm.com/download/win
- GitHub account: https://github.com/signup

---

## Step 1: Initialize Git Repository

Open CMD in project folder:

```cmd
cd C:\Users\SALAAM\Desktop\offchat-admin-nexus-main

REM Initialize git
git init

REM Configure git (first time only)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

---

## Step 2: Create .gitignore

This file tells Git what NOT to upload:

```cmd
echo # Python > .gitignore
echo __pycache__/ >> .gitignore
echo *.py[cod] >> .gitignore
echo *$py.class >> .gitignore
echo venv/ >> .gitignore
echo env/ >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo db.sqlite3 >> .gitignore
echo *.log >> .gitignore
echo.>> .gitignore
echo # Node >> .gitignore
echo node_modules/ >> .gitignore
echo .vite/ >> .gitignore
echo dist/ >> .gitignore
echo package-lock.json >> .gitignore
echo.>> .gitignore
echo # Media >> .gitignore
echo media/ >> .gitignore
echo static/ >> .gitignore
echo.>> .gitignore
echo # IDE >> .gitignore
echo .vscode/ >> .gitignore
echo .idea/ >> .gitignore
```

---

## Step 3: Add Files to Git

```cmd
REM Add all files
git add .

REM Check what will be committed
git status

REM Commit
git commit -m "Initial commit: OffChat Admin Nexus"
```

---

## Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `offchat-admin-nexus`
3. Description: `Full-stack admin dashboard for chat management`
4. Choose **Private** or **Public**
5. **DO NOT** initialize with README, .gitignore, or license
6. Click "Create repository"

---

## Step 5: Push to GitHub

Copy the commands from GitHub (they look like this):

```cmd
git remote add origin https://github.com/YOUR_USERNAME/offchat-admin-nexus.git
git branch -M main
git push -u origin main
```

Enter your GitHub username and password (or personal access token).

---

## Step 6: Verify Upload

1. Go to https://github.com/YOUR_USERNAME/offchat-admin-nexus
2. Check that files are there
3. Verify `frontend/src/lib/api.ts` exists

---

## Step 7: Download on New Device

### Option A: Git Clone
```cmd
cd C:\Projects
git clone https://github.com/YOUR_USERNAME/offchat-admin-nexus.git
cd offchat-admin-nexus
scripts\setup-simple.bat
```

### Option B: Download ZIP
1. Go to repository page
2. Click green "Code" button
3. Click "Download ZIP"
4. Extract and run `scripts\setup-simple.bat`

---

## Common Issues

### Issue: "Permission denied"
**Solution**: Use Personal Access Token instead of password
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Select scopes: `repo`
4. Copy token
5. Use token as password when pushing

### Issue: "Large files"
**Solution**: Files over 100MB need Git LFS
```cmd
git lfs install
git lfs track "*.mp4"
git lfs track "*.zip"
git add .gitattributes
git commit -m "Add Git LFS"
git push
```

### Issue: "Already exists"
**Solution**: Use different repository name or delete existing one

---

## Update Repository

After making changes:

```cmd
git add .
git commit -m "Description of changes"
git push
```

---

## Pull Latest Changes

On any device:

```cmd
cd offchat-admin-nexus
git pull
scripts\setup-simple.bat
```

---

## Branch Strategy (Optional)

For team development:

```cmd
REM Create development branch
git checkout -b development

REM Make changes, then:
git add .
git commit -m "New feature"
git push -u origin development

REM Merge to main when ready
git checkout main
git merge development
git push
```

---

## Troubleshooting

### Check Git Status
```cmd
git status
```

### View Commit History
```cmd
git log --oneline
```

### Undo Last Commit (not pushed)
```cmd
git reset --soft HEAD~1
```

### Remove File from Git (keep local)
```cmd
git rm --cached filename
```

### Clone Specific Branch
```cmd
git clone -b branch-name https://github.com/USER/REPO.git
```

---

## Security Best Practices

1. **Never commit**:
   - `.env` files with secrets
   - `db.sqlite3` with real data
   - API keys or passwords
   - `venv/` or `node_modules/`

2. **Use .gitignore** (already created above)

3. **Use environment variables** for secrets

4. **Make repository private** if it contains sensitive code

---

## Quick Reference

| Task | Command |
|------|---------|
| Initialize | `git init` |
| Add files | `git add .` |
| Commit | `git commit -m "message"` |
| Push | `git push` |
| Pull | `git pull` |
| Status | `git status` |
| Clone | `git clone URL` |
| Create branch | `git checkout -b name` |
| Switch branch | `git checkout name` |

---

## Success Checklist

✅ Git installed
✅ Repository created on GitHub
✅ .gitignore configured
✅ Files committed
✅ Pushed to GitHub
✅ Verified files on GitHub
✅ Tested clone on new device
✅ Setup script works

---

## Need Help?

- Git documentation: https://git-scm.com/doc
- GitHub guides: https://guides.github.com/
- Git cheat sheet: https://education.github.com/git-cheat-sheet-education.pdf
