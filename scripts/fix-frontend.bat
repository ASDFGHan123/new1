@echo off
echo Fixing Vite path resolution issues...
echo.

cd /d "%~dp0..\frontend"

echo Step 1: Stopping any running dev server...
taskkill /F /IM node.exe 2>nul

echo Step 2: Cleaning build artifacts...
if exist "dist" rmdir /s /q dist
if exist ".vite" rmdir /s /q .vite
if exist "node_modules\.vite" rmdir /s /q node_modules\.vite

echo Step 3: Removing compiled JS files from src...
for /r "src" %%f in (*.js) do del /f /q "%%f" 2>nul
for /r "src" %%f in (*.jsx) do del /f /q "%%f" 2>nul

echo Step 4: Reinstalling dependencies...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del /f /q package-lock.json
npm install

echo.
echo Fix complete! Now run: npm run dev
echo.
pause
