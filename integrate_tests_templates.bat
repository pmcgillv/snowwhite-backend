@echo off
REM Automated test integration for label templates
REM Run: integrate_tests_templates.bat

setlocal enabledelayedexpansion

cd /d %~dp0

echo.
echo ===============================================================
echo   LABEL TEMPLATES TESTS - AUTOMATED INTEGRATION
echo ===============================================================
echo.

REM Copy test file to Docker
echo [1/3] Copying test file to Docker...
docker cp test_templates.py snowwhite-api:/app/tests/test_templates.py
if !errorlevel! neq 0 (
    echo ERROR: Could not copy test file
    pause
    exit /b 1
)
echo OK - Test file copied

REM Run template tests
echo [2/3] Running template tests...
docker exec snowwhite-api python -m pytest tests/test_templates.py -v --tb=short
if !errorlevel! neq 0 (
    echo WARNING: Some tests may have failed (check output above)
)

REM Run all tests to check overall coverage
echo.
echo [3/3] Running full test suite to check coverage...
docker exec snowwhite-api python -m pytest -v --tb=short

echo.
echo ===============================================================
echo   TEST EXECUTION COMPLETE
echo ===============================================================
echo.

pause