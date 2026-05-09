@echo off
REM Start Phase 2 Backend Server
REM Backend: FastAPI on localhost:8000

title Phase 2 Backend - FastAPI
cd /d C:\Users\DESMO\Desktop\snowwhite-backend

echo.
echo ========================================
echo Phase 2 Backend Server
echo ========================================
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting FastAPI server...
echo Server will run on: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
