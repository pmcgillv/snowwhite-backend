@echo off
setlocal

echo.
echo ============================================
echo   FIXING CORS ON API (Windows-compatible)
echo ============================================
echo.

REM Create the Python script as a separate file
echo [1] Creating fix script...

(
echo import re
echo.
echo with open('/app/main.py', 'r'^) as f:
echo     content = f.read(^)
echo.
echo if 'CORSMiddleware' not in content:
echo     print('Adding CORS import...'^)
echo     if 'from fastapi.middleware.cors' not in content:
echo         content = content.replace(
echo             'from fastapi import',
echo             'from fastapi.middleware.cors import CORSMiddleware\nfrom fastapi import',
echo             1
echo         ^)
echo.
echo     print('Adding CORS middleware...'^)
echo     cors_block = '\napp.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])\n'
echo     content = re.sub(r'(app\s*=\s*FastAPI\([^)]*\)^)', r'\1' + cors_block, content, count=1^)
echo else:
echo     print('CORS already present - replacing config...'^)
echo     pattern = r'app\.add_middleware\(\s*CORSMiddleware.*?\)'
echo     new_cors = 'app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])'
echo     content = re.sub(pattern, new_cors, content, flags=re.DOTALL^)
echo.
echo with open('/app/main.py', 'w'^) as f:
echo     f.write(content^)
echo.
echo print('SUCCESS - CORS configured'^)
echo print(''^)
echo print('First 25 lines:'^)
echo print('-' * 40^)
echo for i, line in enumerate(content.split('\n'^)[:25]^):
echo     print(f'{i+1}: {line}'^)
) > fix_cors_script.py

echo [2] Copying script to container...
docker cp fix_cors_script.py snowwhite-api:/tmp/fix_cors.py

echo [3] Running fix...
docker exec snowwhite-api python /tmp/fix_cors.py

echo.
echo [4] Restarting API...
docker restart snowwhite-api

echo.
echo Waiting 8 seconds for API to fully restart...
timeout /t 8 /nobreak >nul

echo.
echo [5] Testing CORS...
curl -X OPTIONS http://localhost:8000/api/v1/auth/login -H "Origin: http://localhost:3001" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type" -i

echo.
echo.
echo ============================================
echo If you see 'access-control-allow-origin' above
echo CORS is fixed!
echo ============================================
echo.
echo Now refresh http://localhost:3001 and login:
echo   Email:    admin@admin.com
echo   Password: admin123
echo.

REM Cleanup
del fix_cors_script.py 2>nul

echo Press any key to close...
pause >nul