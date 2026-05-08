@echo off
REM Test login and show full response

echo Testing login with demo@test.com / password123...
echo.

curl -X POST http://localhost:8000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"demo@test.com\",\"password\":\"password123\"}" ^
  -i

echo.
echo.
echo ===============================================================
echo Press any key to close...
echo ===============================================================
pause >nul