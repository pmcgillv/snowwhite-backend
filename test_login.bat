@echo off
REM Test login

echo Testing login...
echo.

curl -X POST http://localhost:8000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"work@test.com\",\"password\":\"work123\"}"

echo.
echo.
echo If you see a token above, login works!
echo Try again at http://localhost:3001
echo.
pause