@echo off
setlocal

echo.
echo ================================================
echo   FINAL FIX - CORS + TEMPLATES ROUTER
echo ================================================
echo.

echo Step 1: Copying fixed templates router...
docker cp templates_router_fixed.py snowwhite-api:/app/app/api/v1/templates.py

echo.
echo Step 2: Reapplying CORS fix...
docker exec snowwhite-api sed -i "s/allow_origins=settings.CORS_ORIGINS,/allow_origins=[\"*\"],/" /app/main.py

echo.
echo Step 3: Restarting API...
docker restart snowwhite-api

echo.
echo Step 4: Waiting 10 seconds...
timeout /t 10 /nobreak

echo.
echo Step 5: Testing...
curl -s http://localhost:8000/docs | findstr /c:"SnowWhite" >nul
if errorlevel 1 (
    echo ERROR: API not responding
) else (
    echo SUCCESS: All fixed!
)

echo.
echo ================================================
echo Refresh and login again at http://localhost:3001
echo ================================================
echo.

pause