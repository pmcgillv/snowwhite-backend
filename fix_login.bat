@echo off
setlocal

echo.
echo ============================================
echo   FINAL FIX - Register and Test Login
echo ============================================
echo.

echo [1] Registering new user via API...
echo.

curl -X POST http://localhost:8000/api/v1/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@admin.com\",\"password\":\"admin123\",\"full_name\":\"Admin User\",\"organization_name\":\"Admin Org\"}" ^
  -w "\n\nHTTP Status: %%{http_code}\n"

echo.
echo ============================================
echo [2] Testing login...
echo ============================================
echo.

curl -X POST http://localhost:8000/api/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@admin.com\",\"password\":\"admin123\"}" ^
  -w "\n\nHTTP Status: %%{http_code}\n"

echo.
echo ============================================
echo   IF YOU SEE access_token ABOVE - IT WORKS!
echo ============================================
echo.
echo   Login at http://localhost:3001
echo   Email:    admin@admin.com
echo   Password: admin123
echo.
echo Press any key to exit...
pause >nul