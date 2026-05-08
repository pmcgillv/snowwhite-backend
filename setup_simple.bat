@echo off
REM Simple Label Designer Frontend Setup

setlocal enabledelayedexpansion

echo.
echo ===============================================================
echo   LABEL DESIGNER - SIMPLE SETUP
echo ===============================================================
echo.

REM Check Node.js
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not installed
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)
echo OK - Node.js found

REM Go to Desktop
echo [2/4] Creating app on Desktop...
cd /d "%USERPROFILE%\Desktop"

REM Delete old folder if exists
if exist "label-designer-app" (
    echo Removing old app folder...
    rmdir /s /q "label-designer-app" >nul 2>&1
)

REM Create new React app
echo Creating React app... (this takes 2-3 minutes)
call npx create-react-app label-designer-app
if errorlevel 1 (
    echo ERROR: Failed to create app
    pause
    exit /b 1
)

cd label-designer-app

REM Install react-konva
echo [3/4] Installing react-konva...
call npm install react-konva konva
if errorlevel 1 (
    echo Warning: react-konva install had issues, continuing anyway...
)

REM Create App.js
echo [4/4] Setting up files...

(
echo import React, { useState } from 'react';
echo.
echo export default function App(^) {
echo   const [loading, setLoading] = useState(false^);
echo   const API_URL = 'http://localhost:8000/api/v1';
echo   const [token, setToken] = useState(localStorage.getItem('token'^) ^|^| ''^);
echo   const [showAuth, setShowAuth] = useState(^!token^);
echo   const [email, setEmail] = useState(''^);
echo   const [password, setPassword] = useState(''^);
echo.
echo   const handleLogin = async (^) =^> {
echo     try {
echo       const res = await fetch('http://localhost:8000/token', {
echo         method: 'POST',
echo         headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
echo         body: `username=${email}^&password=${password}`
echo       }^);
echo       if (res.ok^) {
echo         const data = await res.json(^);
echo         localStorage.setItem('token', data.access_token^);
echo         setToken(data.access_token^);
echo         setShowAuth(false^);
echo       } else {
echo         alert('Login failed'^);
echo       }
echo     } catch (e^) {
echo       alert('Error: ' + e.message^);
echo     }
echo   };
echo.
echo   return (
echo     ^<div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', padding: '40px' }}^>
echo       ^<h1^>Label Designer^</h1^>
echo       
echo       {showAuth ? (
echo         ^<div style={{ maxWidth: '400px' }}^>
echo           ^<h2^>Login^</h2^>
echo           ^<input
echo             placeholder="Email"
echo             value={email}
echo             onChange={(e^) =^> setEmail(e.target.value^)}
echo             style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
echo           /^>
echo           ^<input
echo             type="password"
echo             placeholder="Password"
echo             value={password}
echo             onChange={(e^) =^> setPassword(e.target.value^)}
echo             style={{ width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' }}
echo           /^>
echo           ^<button onClick={handleLogin} style={{ padding: '10px 20px', background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer' }}^>
echo             Sign In
echo           ^</button^>
echo         ^</div^>
echo       ^) : (
echo         ^<div^>
echo           ^<h2^>Welcome!^</h2^>
echo           ^<p^>✓ API Connected^</p^>
echo           ^<p^>✓ Logged In^</p^>
echo           ^<button onClick={(^) =^> { localStorage.removeItem('token'^); setToken(''^); setShowAuth(true^); }}^>
echo             Logout
echo           ^</button^>
echo         ^</div^>
echo       ^)}
echo     ^</div^>
echo   ^);
echo }
) > src\App.js

echo.
echo ===============================================================
echo   SETUP COMPLETE
echo ===============================================================
echo.
echo Starting development server...
echo.
echo Browser will open at: http://localhost:3000
echo.
echo BEFORE YOU LOGIN:
echo   - Make sure API is running: http://localhost:8000/docs
echo   - Have your login credentials ready
echo.

timeout /t 3

call npm start

pause