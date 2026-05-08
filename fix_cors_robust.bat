@echo off
setlocal enabledelayedexpansion

echo.
echo ================================================
echo   CORS FIX - ROBUST VERSION
echo ================================================
echo.

REM Create proper Python script
echo Creating fix script...

(
echo from pathlib import Path
echo.
echo main_file = Path('/app/main.py'^)
echo content = main_file.read_text(^)
echo.
echo if 'CORSMiddleware' not in content:
echo     print('Adding CORS...'
echo     ^)
echo     import_line = 'from fastapi import FastAPI'
echo     cors_import = 'from fastapi.middleware.cors import CORSMiddleware'
echo     if cors_import not in content:
echo         content = content.replace(import_line, cors_import + '\nfrom fastapi import FastAPI'^)
echo.
echo     app_line = 'app = FastAPI(title='
echo     cors_middleware = '''
echo app.add_middleware(
echo     CORSMiddleware,
echo     allow_origins=["*"],
echo     allow_credentials=True,
echo     allow_methods=["*"],
echo     allow_headers=["*"],
echo ^)
echo '''
echo     content = content.replace(app_line, cors_middleware + '\napp = FastAPI(title='^)
echo     main_file.write_text(content^)
echo     print('SUCCESS - CORS added'^)
echo else:
echo     print('CORS already present'^)
echo.
echo print('^)
echo print('Showing first 40 lines:'^)
echo print('=' * 50^)
echo lines = content.split('\n'^)[:40]
echo for i, line in enumerate(lines, 1^):
echo     print(f'{i:3}: {line}'^)
) > apply_cors.py

echo Step 1: Copying script to container...
docker cp apply_cors.py snowwhite-api:/tmp/apply_cors.py

echo.
echo Step 2: Running script...
docker exec snowwhite-api python /tmp/apply_cors.py

echo.
echo Step 3: Stopping API...
docker stop snowwhite-api

echo.
echo Step 4: Restarting API...
docker start snowwhite-api

echo.
echo Waiting 10 seconds...
timeout /t 10 /nobreak

echo.
echo Step 5: Checking if API is responding...
curl -s http://localhost:8000/docs ^| findstr /c:"SnowWhite API" >nul
if errorlevel 1 (
    echo ERROR: API not responding
) else (
    echo OK: API is running
)

echo.
echo ================================================
echo DONE - Try login at http://localhost:3001
echo ================================================
echo.

del apply_cors.py 2>nul

pause