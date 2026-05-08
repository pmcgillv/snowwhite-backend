@echo off
REM Diagnostic - check what's working

echo.
echo ===============================================================
echo   API DIAGNOSTIC
echo ===============================================================
echo.

echo [1] Checking if API is running...
curl -s http://localhost:8000/docs > nul 2>&1
if errorlevel 1 (
    echo ERROR: API not responding
    pause
    exit /b 1
)
echo OK - API is running

echo.
echo [2] Testing login endpoint...
curl -X POST http://localhost:8000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"test123\"}" ^
  -v

echo.
echo [3] Checking database for users...
docker exec snowwhite-api python -c "from app.database import SessionLocal; from app.database_models import User; db = SessionLocal(); users = db.query(User).all(); print(f'Total users: {len(users)}'); [print(f'  - {u.email}') for u in users]"

echo.
pause