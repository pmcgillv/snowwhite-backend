@echo off
setlocal

echo.
echo ================================================
echo   UPDATING FRONTEND WITH TEMPLATE FEATURES
echo ================================================
echo.

echo Copying updated App.js...
copy App_updated.js "%USERPROFILE%\Desktop\label-designer-app\src\App.js" >nul

if errorlevel 1 (
    echo ERROR: Could not copy file
    pause
    exit /b 1
)

echo.
echo SUCCESS - App.js updated!
echo.
echo The React app will auto-refresh at:
echo   http://localhost:3001
echo.
echo You should now see:
echo   - Create New Template form
echo   - List of your templates
echo.
echo Try creating a template called "Product Label"
echo.

pause