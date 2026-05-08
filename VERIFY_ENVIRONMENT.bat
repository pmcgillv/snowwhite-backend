@echo off
REM ========================================
REM PHASE 2 ENVIRONMENT VERIFICATION
REM ========================================
REM Run this once to verify your entire setup
REM ========================================

echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   PHASE 2 ENVIRONMENT VERIFICATION - SNOWWHITE             ║
echo ║   Running on: %COMPUTERNAME%                              ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Track failures
set FAILURES=0

REM ========== GIT CHECK ==========
echo [1/8] Checking Git...
git --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✅ Git installed
    for /f "tokens=*" %%i in ('git --version') do echo      %%i
) else (
    echo   ❌ Git NOT FOUND - Download from https://git-scm.com/download/win
    set /a FAILURES=%FAILURES%+1
)
echo.

REM ========== PYTHON CHECK ==========
echo [2/8] Checking Python...
python --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✅ Python installed
    for /f "tokens=*" %%i in ('python --version') do echo      %%i
) else (
    echo   ❌ Python NOT FOUND - Download from https://www.python.org/
    set /a FAILURES=%FAILURES%+1
)
echo.

REM ========== NODE CHECK ==========
echo [3/8] Checking Node.js...
node --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✅ Node.js installed
    for /f "tokens=*" %%i in ('node --version') do echo      %%i
) else (
    echo   ❌ Node.js NOT FOUND - Download from https://nodejs.org/
    set /a FAILURES=%FAILURES%+1
)
echo.

REM ========== NPM CHECK ==========
echo [4/8] Checking npm...
npm --version >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo   ✅ npm installed
    for /f "tokens=*" %%i in ('npm --version') do echo      %%i
) else (
    echo   ❌ npm NOT FOUND
    set /a FAILURES=%FAILURES%+1
)
echo.

REM ========== BACKEND DIRECTORY CHECK ==========
echo [5/8] Checking backend directory...
if exist "C:\Users\DESMO\Desktop\snowwhite-backend\app" (
    echo   ✅ Backend directory found
    echo      C:\Users\DESMO\Desktop\snowwhite-backend\
) else (
    echo   ❌ Backend directory NOT found at C:\Users\DESMO\Desktop\snowwhite-backend\
    set /a FAILURES=%FAILURES%+1
)
echo.

REM ========== FRONTEND DIRECTORY CHECK ==========
echo [6/8] Checking frontend directory...
if exist "C:\Users\DESMO\Desktop\label-designer-app\src" (
    echo   ✅ Frontend directory found
    echo      C:\Users\DESMO\Desktop\label-designer-app\
) else (
    echo   ❌ Frontend directory NOT found at C:\Users\DESMO\Desktop\label-designer-app\
    set /a FAILURES=%FAILURES%+1
)
echo.

REM ========== BACKEND SETUP CHECK ==========
echo [7/8] Checking backend setup...
cd /d C:\Users\DESMO\Desktop\snowwhite-backend 2>nul
if %ERRORLEVEL% EQU 0 (
    if exist "requirements.txt" (
        echo   ✅ requirements.txt found
    ) else (
        echo   ⚠️  requirements.txt NOT found
        set /a FAILURES=%FAILURES%+1
    )
    
    if exist "venv" (
        echo   ✅ Virtual environment exists
    ) else (
        echo   ⚠️  Virtual environment NOT created - will create next step
    )
) else (
    echo   ❌ Cannot navigate to backend directory
    set /a FAILURES=%FAILURES%+1
)
echo.

REM ========== FRONTEND SETUP CHECK ==========
echo [8/8] Checking frontend setup...
cd /d C:\Users\DESMO\Desktop\label-designer-app 2>nul
if %ERRORLEVEL% EQU 0 (
    if exist "package.json" (
        echo   ✅ package.json found
    ) else (
        echo   ❌ package.json NOT found
        set /a FAILURES=%FAILURES%+1
    )
    
    if exist "node_modules" (
        echo   ✅ node_modules exists (dependencies installed)
    ) else (
        echo   ⚠️  node_modules NOT found - will install next step
    )
) else (
    echo   ❌ Cannot navigate to frontend directory
    set /a FAILURES=%FAILURES%+1
)
echo.

REM ========== FINAL REPORT ==========
echo ╔════════════════════════════════════════════════════════════╗
echo ║                    VERIFICATION SUMMARY                    ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

if %FAILURES% EQU 0 (
    echo ✅ ALL CHECKS PASSED - Ready to build Phase 2!
    echo.
    echo Next steps:
    echo   1. cd C:\Users\DESMO\Desktop\snowwhite-backend
    echo   2. venv\Scripts\activate
    echo   3. pip install -r requirements.txt
    echo   4. git checkout -b phase-2-serialization
    echo   5. START BUILDING!
    echo.
    pause
) else (
    echo ❌ %FAILURES% CHECKS FAILED
    echo.
    echo Fix the issues above, then run this script again.
    echo.
    pause
    exit /b 1
)