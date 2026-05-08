@echo off
REM Fix foreign key references in database models

cd /d %~dp0

echo.
echo ===============================================================
echo   FIXING DATABASE MODEL FOREIGN KEYS
echo ===============================================================
echo.

echo [1/2] Correcting table name references...
docker exec snowwhite-api python -c "
import re

# Read the file
with open('/app/app/database_models.py', 'r') as f:
    content = f.read()

# Fix the references
content = content.replace('ForeignKey(\"user.id\")', 'ForeignKey(\"users.id\")')
content = content.replace('ForeignKey(\"organization.id\")', 'ForeignKey(\"organizations.id\")')

# Write back
with open('/app/app/database_models.py', 'w') as f:
    f.write(content)

print('FIXED: Updated foreign key references')
print('  - user -> users')
print('  - organization -> organizations')
"

echo [2/2] Restarting API...
docker-compose restart snowwhite-api
timeout /t 15 /nobreak

echo.
echo ===============================================================
echo   RESTART COMPLETE - Testing API...
echo ===============================================================
echo.

curl http://localhost:8000/docs 2>nul >nul && (
    echo SUCCESS - API is now RUNNING
    echo.
    echo Open: http://localhost:8000/docs
) || (
    echo Still loading... try http://localhost:8000/docs in 10 seconds
)

echo.
pause