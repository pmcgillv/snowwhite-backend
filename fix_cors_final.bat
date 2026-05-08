@echo off
setlocal

echo.
echo ================================================
echo   ADDING CORS - SIMPLE METHOD
echo ================================================
echo.

echo Step 1: Backing up main.py...
docker exec snowwhite-api cp /app/main.py /app/main.py.bak

echo.
echo Step 2: Adding CORS with sed...
docker exec snowwhite-api sed -i "1s/^/from fastapi.middleware.cors import CORSMiddleware\n/" /app/main.py

echo.
echo Step 3: Adding middleware...
docker exec snowwhite-api sed -i "/app = FastAPI/a\\\napp.add_middleware(\n    CORSMiddleware,\n    allow_origins=[\"*\"],\n    allow_credentials=True,\n    allow_methods=[\"*\"],\n    allow_headers=[\"*\"],\n)" /app/main.py

echo.
echo Step 4: Restarting API...
docker restart snowwhite-api

echo.
echo Step 5: Waiting 8 seconds...
timeout /t 8 /nobreak

echo.
echo Step 6: Testing...
curl http://localhost:8000/docs | findstr /c:"SnowWhite" >nul
if errorlevel 1 (
    echo ERROR: API not running - restoring backup
    docker exec snowwhite-api cp /app/main.py.bak /app/main.py
    docker restart snowwhite-api
) else (
    echo OK: API is working
)

echo.
echo ================================================
echo Try login at http://localhost:3001
echo ================================================
echo.

pause