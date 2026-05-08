@echo off
setlocal

echo.
echo ================================================
echo   FINAL DEPLOYMENT - PERMANENT CORS + FULL APP
echo ================================================
echo.

echo Step 1: Copying permanent main.py with CORS...
docker cp main_permanent_cors.py snowwhite-api:/app/main.py

echo.
echo Step 2: Restarting API...
docker restart snowwhite-api

echo.
echo Step 3: Waiting 10 seconds for restart...
timeout /t 10 /nobreak

echo.
echo Step 4: Testing API...
curl -s http://localhost:8000/docs | findstr /c:"SnowWhite" >nul
if errorlevel 1 (
    echo ERROR: API not responding
) else (
    echo SUCCESS: API running with permanent CORS!
)

echo.
echo ================================================
echo App Files Ready:
echo - App_full.js (copy to label-designer-app/src/App.js)
echo ================================================
echo.

echo Step 5: Copy instructions...
echo.
echo NEXT STEPS:
echo 1. Copy App_full.js code from right panel
echo 2. Paste into C:\Users\DESMO\Desktop\label-designer-app\src\App.js
echo 3. Save the file
echo 4. Refresh http://localhost:3001
echo.
echo New Features:
echo - Edit template names
echo - Delete templates
echo - Canvas designer preview
echo.

pause