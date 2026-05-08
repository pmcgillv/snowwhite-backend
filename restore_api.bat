@echo off
setlocal

echo.
echo ================================================
echo   RESTORING API AND APPLYING CORS FIX
echo ================================================
echo.

echo Step 1: Restoring backup...
docker exec snowwhite-api cp /app/main.py.bak /app/main.py 2>nul
if errorlevel 1 (
    echo Backup not found, continuing anyway...
)

echo.
echo Step 2: Stopping container...
docker stop snowwhite-api >nul 2>&1

echo.
echo Step 3: Copying working main.py...
docker cp main.py snowwhite-api:/app/main.py

echo.
echo Step 4: Starting container...
docker start snowwhite-api

echo.
echo Step 5: Waiting 10 seconds for restart...
timeout /t 10 /nobreak

echo.
echo Step 6: Testing API...
curl -s http://localhost:8000/docs | findstr /c:"SnowWhite" >nul
if errorlevel 1 (
    echo ERROR: API still not responding
    echo Logs:
    docker logs snowwhite-api --tail 20
) else (
    echo SUCCESS: API is running with CORS!
)

echo.
echo ================================================
echo Refresh http://localhost:3001 and try login:
echo   Email:    admin@admin.com
echo   Password: admin123
echo ================================================
echo.

pause