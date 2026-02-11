@echo off
echo ============================================================
echo   CRITICAL: Missing Frontend Files Detected
echo ============================================================
echo.
echo The frontend/src/lib/ directory is missing critical files:
echo   - api.ts
echo   - utils.ts
echo   - websocket.ts
echo.
echo SOLUTION:
echo 1. Make sure you copied the COMPLETE project folder
echo 2. Check that frontend/src/lib/ contains .ts files
echo 3. Do NOT copy from a built/compiled version
echo.
echo Current location: %CD%
echo.
echo Checking files...
echo.

if not exist "frontend\src\lib\api.ts" (
    echo [MISSING] frontend\src\lib\api.ts
) else (
    echo [OK] frontend\src\lib\api.ts
)

if not exist "frontend\src\lib\utils.ts" (
    echo [MISSING] frontend\src\lib\utils.ts
) else (
    echo [OK] frontend\src\lib\utils.ts
)

if not exist "frontend\src\lib\websocket.ts" (
    echo [MISSING] frontend\src\lib\websocket.ts
) else (
    echo [OK] frontend\src\lib\websocket.ts
)

echo.
echo ============================================================
echo.
echo ACTION REQUIRED:
echo 1. Get the complete source code (not a build)
echo 2. Ensure all .ts files are present
echo 3. Run setup-simple.bat again
echo.
pause
