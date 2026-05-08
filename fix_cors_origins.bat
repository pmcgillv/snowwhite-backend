@echo off
setlocal

echo.
echo ================================================
echo   FIXING CORS ORIGINS
echo ================================================
echo.

echo Modifying main.py to allow all origins...

docker exec snowwhite-api sed -i "s/allow_origins=settings.CORS_ORIGINS,/allow_origins=[\"*\"],/" /app/main.py

echo.
echo Restarting API...
docker restart snowwhite-api

echo.
echo Waiting 8 seconds...
timeout /t 8 /nobreak

echo.
echo Testing...
curl -s http://localhost:8000/docs | findstr /c:"SnowWhite" >nul
if errorlevel 1 (
    echo ERROR: API not responding
) else (
    echo SUCCESS: API is running
)

echo.
echo ================================================
echo Refresh http://localhost:3001 and try login
echo ================================================
echo.

pause