@echo off
REM Simple CORS fix

color 0a
title CORS Fix - Snowwhite API

echo.
echo ============================================
echo   SNOWWHITE - CORS FIX
echo ============================================
echo.

echo Step 1: Creating Python fix file...
(
echo import os
echo os.chdir('/app'^)
echo with open('main.py'^) as f:
echo     code = f.read(^)
echo if 'CORSMiddleware' not in code:
echo     code = code.replace('from fastapi import FastAPI', 'from fastapi import FastAPI\nfrom fastapi.middleware.cors import CORSMiddleware'^)
echo     code = code.replace('app = FastAPI(^)', 'app = FastAPI(^)\napp.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]'^)
echo with open('main.py', 'w'^) as f:
echo     f.write(code^)
echo print('CORS CONFIGURED'^)
) > cors_fix.py

docker cp cors_fix.py snowwhite-api:/tmp/cors_fix.py
docker exec snowwhite-api python /tmp/cors_fix.py

echo.
echo Step 2: Restarting API container...
docker restart snowwhite-api

echo.
echo Step 3: Waiting 10 seconds for restart...
timeout /t 10

echo.
echo Step 4: Testing API...
curl http://localhost:8000/docs

echo.
echo ============================================
echo DONE!
echo Refresh: http://localhost:3001
echo Login: admin@admin.com / admin123
echo ============================================
echo.

del cors_fix.py 2>nul

echo Press any key to exit...
pause