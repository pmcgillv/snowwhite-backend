@echo off
REM One-click integration for batch processing feature
REM Just run: integrate_batch.bat

setlocal enabledelayedexpansion

cd /d %~dp0

echo.
echo ===============================================================
echo   SNOWWHITE BATCH PROCESSING - AUTOMATED INTEGRATION
echo ===============================================================
echo.

REM Copy setup script into Docker
echo [1/4] Copying setup script to Docker...
docker cp setup_batch_processing.py snowwhite-api:/app/setup_batch_processing.py
if !errorlevel! neq 0 (
    echo ERROR: Could not copy script to Docker
    echo Make sure Docker is running: docker ps
    pause
    exit /b 1
)

REM Run setup script
echo [2/4] Running integration script...
docker exec snowwhite-api python /app/setup_batch_processing.py
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
echo   ✅ INTEGRATION COMPLETE!
echo ===============================================================
echo.
echo New endpoints available:
echo   POST   /api/v1/labels/batch-upload
echo   GET    /api/v1/labels/jobs/{job_id}
echo   GET    /api/v1/labels/jobs/{job_id}/download
echo   GET    /api/v1/labels/jobs/
echo   DELETE /api/v1/labels/jobs/{job_id}
echo.
echo API docs: http://localhost:8000/docs
echo.
echo ===============================================================

pause