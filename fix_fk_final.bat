@echo off
REM One-click fix for database foreign key issues

cd /d %~dp0

echo.
echo ===============================================================
echo   SNOWWHITE - DATABASE FOREIGN KEY FIX
echo ===============================================================
echo.

echo [1/3] Fixing foreign key references...
docker exec snowwhite-api python -c ^
  "with open('/app/app/database_models.py') as f: c=f.read(); c=c.replace('ForeignKey(\"organization.id\")', 'ForeignKey(\"organizations.id\")'); c=c.replace('ForeignKey(\"user.id\")', 'ForeignKey(\"users.id\")'); open('/app/app/database_models.py','w').write(c); print('FIXED')"

echo [2/3] Restarting API container...
docker-compose restart snowwhite-api
timeout /t 15 /nobreak

echo.
echo [3/3] Checking API status...
curl -s http://localhost:8000/docs > nul
if errorlevel 1 (
    echo Still loading... Please wait 10 more seconds
) else (
    echo SUCCESS - API is running!
)

echo.
echo ===============================================================
echo Open browser: http://localhost:8000/docs
echo ===============================================================
echo.

pause