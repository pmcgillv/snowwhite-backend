@echo off
REM One-click integration for Label Designer backend
REM Run: integrate_label_designer.bat

setlocal enabledelayedexpansion

cd /d %~dp0

echo.
echo ===============================================================
echo   SNOWWHITE LABEL DESIGNER - BACKEND INTEGRATION
echo ===============================================================
echo.

REM Copy setup script into Docker
echo [1/4] Copying setup script to Docker...
docker cp setup_label_designer.py snowwhite-api:/app/setup_label_designer.py
if !errorlevel! neq 0 (
    echo ERROR: Could not copy script to Docker
    echo Make sure Docker is running: docker ps
    pause
    exit /b 1
)

REM Run setup script
echo [2/4] Running integration script...
docker exec snowwhite-api python /app/setup_label_designer.py
if !errorlevel! neq 0 (
    echo ERROR: Integration script failed
    pause
    exit /b 1
)

REM Rebuild Docker
echo [3/4] Rebuilding Docker...
docker-compose down
docker-compose up -d --build
if !errorlevel! neq 0 (
    echo ERROR: Docker build failed
    pause
    exit /b 1
)

REM Wait for build
echo [4/4] Waiting 60 seconds for Docker to build...
timeout /t 60 /nobreak

REM Verify
echo.
echo ===============================================================
echo   RUNNING TESTS TO VERIFY...
echo ===============================================================
echo.
docker exec snowwhite-api python -m pytest -v

echo.
echo ===============================================================
echo   ✅ LABEL DESIGNER BACKEND COMPLETE!
echo ===============================================================
echo.
echo New endpoints available:
echo   POST   /api/v1/templates
echo   GET    /api/v1/templates
echo   GET    /api/v1/templates/{template_id}
echo   PUT    /api/v1/templates/{template_id}
echo   DELETE /api/v1/templates/{template_id}
echo.
echo Files available for React frontend:
echo   - LabelDesigner.jsx (main canvas component)
echo.
echo API docs: http://localhost:8000/docs
echo.
echo ===============================================================

pause