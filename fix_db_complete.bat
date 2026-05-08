@echo off
REM Complete database model fix

cd /d %~dp0

echo.
echo ===============================================================
echo   SNOWWHITE - COMPLETE DATABASE MODEL FIX
echo ===============================================================
echo.

echo [1/4] Stopping API...
docker-compose stop snowwhite-api

echo [2/4] Fixing database_models.py...
docker exec snowwhite-db psql -U postgres -d snowwhite -c "DROP TABLE IF EXISTS batch_jobs CASCADE;" 2>nul || true
docker exec snowwhite-db psql -U postgres -d snowwhite -c "DROP TABLE IF EXISTS templates CASCADE;" 2>nul || true

REM Now fix the Python file
docker exec snowwhite-api python << 'PYTHON_SCRIPT'
import re

with open('/app/app/database_models.py', 'r') as f:
    content = f.read()

# Find and fix all incorrect references
replacements = [
    ('ForeignKey("user.id")', 'ForeignKey("users.id")'),
    ('ForeignKey("organization.id")', 'ForeignKey("organizations.id")'),
    ('ForeignKey("user.', 'ForeignKey("users.'),
    ('ForeignKey("organization.', 'ForeignKey("organizations.'),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"Fixed: {old} -> {new}")

with open('/app/app/database_models.py', 'w') as f:
    f.write(content)

print("\nDatabase models updated successfully")
PYTHON_SCRIPT

echo.
echo [3/4] Restarting Docker...
docker-compose up -d --force-recreate snowwhite-api
timeout /t 20 /nobreak

echo.
echo [4/4] Verifying API...
curl -s http://localhost:8000/docs > nul && (
    echo.
    echo ===============================================================
    echo   SUCCESS - API IS NOW RUNNING
    echo ===============================================================
    echo.
    echo Open in browser: http://localhost:8000/docs
    echo.
) || (
    echo.
    echo Still starting... Please wait 10 more seconds
    echo Then try: http://localhost:8000/docs
    echo.
)

pause