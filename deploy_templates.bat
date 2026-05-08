@echo off
setlocal

echo.
echo ================================================
echo   DEPLOYING TEMPLATES ROUTER
echo ================================================
echo.

echo Step 1: Copying templates router...
docker cp templates_router.py snowwhite-api:/app/app/api/v1/templates.py

echo.
echo Step 2: Restarting API...
docker restart snowwhite-api

echo.
echo Step 3: Waiting 8 seconds...
timeout /t 8 /nobreak

echo.
echo Step 4: Testing...
curl -s http://localhost:8000/docs | findstr /c:"SnowWhite" >nul
if errorlevel 1 (
    echo ERROR: API not responding
) else (
    echo SUCCESS: API is running with templates router
)

echo.
echo ================================================
echo Refresh http://localhost:3001 and try again!
echo ================================================
echo.

pause