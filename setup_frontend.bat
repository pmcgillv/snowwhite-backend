@echo off
REM Automated Label Designer Frontend Setup & Launch

setlocal enabledelayedexpansion

cd /d %~dp0

echo.
echo ===============================================================
echo   LABEL DESIGNER - FRONTEND AUTO SETUP
echo ===============================================================
echo.

REM Check if Node.js is installed
echo [1/5] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo OK - Node.js %NODE_VERSION% found

REM Check if app folder exists
echo [2/5] Setting up React app...
if not exist "label-designer-app" (
    echo Creating new React app...
    call npx create-react-app label-designer-app
    if errorlevel 1 (
        echo ERROR: Failed to create React app
        pause
        exit /b 1
    )
    echo OK - React app created
) else (
    echo OK - App folder exists
)

cd label-designer-app

REM Install dependencies
echo [3/5] Installing dependencies...
call npm list react-konva >nul 2>&1
if errorlevel 1 (
    echo Installing react-konva and konva...
    call npm install react-konva konva
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo OK - Dependencies installed
) else (
    echo OK - Dependencies already installed
)

REM Copy component
echo [4/5] Setting up Label Designer component...
(
    echo import LabelDesignerApp from './LabelDesignerApp';
    echo.
    echo export default LabelDesignerApp;
) > src\App.js

REM Create LabelDesignerApp.jsx file
echo Creating component file...
(
echo import React, { useState, useEffect, useRef } from 'react';
echo import { Stage, Layer, Text, Rect, Image as KonvaImage } from 'react-konva';
echo.
echo export default function LabelDesignerApp() {
echo   const [view, setView] = useState('templates');
echo   const [templates, setTemplates] = useState([]^);
echo   const [currentTemplate, setCurrentTemplate] = useState(null^);
echo   const [elements, setElements] = useState([]^);
echo   const [selectedElement, setSelectedElement] = useState(null^);
echo   const [loading, setLoading] = useState(false^);
echo   const [error, setError] = useState(''^);
echo   const [token, setToken] = useState(localStorage.getItem('token'^) ^|^| ''^);
echo   const API_URL = 'http://localhost:8000/api/v1';
echo.
echo   const [showAuth, setShowAuth] = useState(^!token^);
echo   const [authForm, setAuthForm] = useState({ email: '', password: '' }^);
echo.
echo   const fetchTemplates = async (^) =^> {
echo     if (^!token^) return;
echo     setLoading(true^);
echo     try {
echo       const res = await fetch(`${API_URL}/templates`, {
echo         headers: { Authorization: `Bearer ${token}` }
echo       }^);
echo       if (res.ok^) {
echo         const data = await res.json(^);
echo         setTemplates(data.templates ^|^| []^);
echo         setError(''^);
echo       } else {
echo         setError('Failed to load templates'^);
echo       }
echo     } catch (e^) {
echo       setError('Connection error: ' + e.message^);
echo     }
echo     setLoading(false^);
echo   };
echo.
echo   useEffect(^(^) =^> {
echo     if (token ^&^& view === 'templates'^) {
echo       fetchTemplates(^);
echo     }
echo   }, [token, view]^);
echo.
echo   const createTemplate = async (name, width = 210, height = 297^) =^> {
echo     try {
echo       const res = await fetch(`${API_URL}/templates`, {
echo         method: 'POST',
echo         headers: {
echo           'Authorization': `Bearer ${token}`,
echo           'Content-Type': 'application/json'
echo         },
echo         body: JSON.stringify({
echo           name,
echo           width,
echo           height,
echo           label_format: 'a4_6up',
echo           elements: []
echo         }^)
echo       }^);
echo       if (res.ok^) {
echo         const newTemplate = await res.json(^);
echo         setCurrentTemplate(newTemplate^);
echo         setElements([]^);
echo         setView('designer'^);
echo         fetchTemplates(^);
echo       }
echo     } catch (e^) {
echo       setError('Failed to create template: ' + e.message^);
echo     }
echo   };
echo.
echo   const saveTemplate = async (^) =^> {
echo     if (^!currentTemplate^) return;
echo     try {
echo       const res = await fetch(`${API_URL}/templates/${currentTemplate.id}`, {
echo         method: 'PUT',
echo         headers: {
echo           'Authorization': `Bearer ${token}`,
echo           'Content-Type': 'application/json'
echo         },
echo         body: JSON.stringify({ elements }^)
echo       }^);
echo       if (res.ok^) {
echo         setError(''^);
echo         alert('Template saved!'^);
echo       }
echo     } catch (e^) {
echo       setError('Failed to save: ' + e.message^);
echo     }
echo   };
echo.
echo   const addTextElement = (^) =^> {
echo     const newElement = {
echo       id: Date.now(^).toString(^),
echo       type: 'text',
echo       x: 50,
echo       y: 50,
echo       text: 'New Text',
echo       fontSize: 16,
echo       fill: '#000000'
echo     };
echo     setElements([...elements, newElement]^);
echo   };
echo.
echo   const updateElement = (id, updates^) =^> {
echo     setElements(elements.map(el =^> el.id === id ? { ...el, ...updates } : el^)^);
echo   };
echo.
echo   const deleteElement = (id^) =^> {
echo     setElements(elements.filter(el =^> el.id ^!== id^)^);
echo     setSelectedElement(null^);
echo   };
echo.
echo   return (
echo     ^<div style={styles.container}^>
echo       ^<div style={styles.header}^>
echo         ^<div style={styles.logo}^>
echo           ^<span style={styles.logoIcon}^>◆^</span^>
echo           ^<span style={styles.logoText}^>LabelStudio^</span^>
echo         ^</div^>
echo         {token ^&^& (
echo           ^<button 
echo             onClick={^(^) =^> { 
echo               localStorage.removeItem('token'^); 
echo               setToken(''^); 
echo               setShowAuth(true^); 
echo             }}
echo             style={styles.logoutBtn}
echo           ^>
echo             Logout
echo           ^</button^>
echo         ^)}
echo       ^</div^>
echo.
echo       {showAuth ^&^& (
echo         ^<div style={styles.authScreen}^>
echo           ^<div style={styles.authCard}^>
echo             ^<h1 style={styles.authTitle}^>Welcome to LabelStudio^</h1^>
echo             ^<p style={styles.authSubtitle}^>Sign in to design your labels^</p^>
echo             
echo             ^<input
echo               type="email"
echo               placeholder="Email"
echo               value={authForm.email}
echo               onChange={(e^) =^> setAuthForm({...authForm, email: e.target.value}^)}
echo               style={styles.input}
echo             /^>
echo             
echo             ^<input
echo               type="password"
echo               placeholder="Password"
echo               value={authForm.password}
echo               onChange={(e^) =^> setAuthForm({...authForm, password: e.target.value}^)}
echo               style={styles.input}
echo             /^>
echo.
echo             ^<button
echo               onClick={async (^) =^> {
echo                 try {
echo                   const res = await fetch(`${API_URL.replace('/api/v1', '')}/token`, {
echo                     method: 'POST',
echo                     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
echo                     body: `username=${authForm.email}^&password=${authForm.password}`
echo                   }^);
echo                   if (res.ok^) {
echo                     const data = await res.json(^);
echo                     localStorage.setItem('token', data.access_token^);
echo                     setToken(data.access_token^);
echo                     setShowAuth(false^);
echo                     setAuthForm({ email: '', password: '' }^);
echo                   } else {
echo                     setError('Invalid credentials'^);
echo                   }
echo                 } catch (e^) {
echo                   setError('Login failed: ' + e.message^);
echo                 }
echo               }}
echo               style={styles.authBtn}
echo             ^>
echo               Sign In
echo             ^</button^>
echo.
echo             {error ^&^& ^<p style={styles.errorText}^>{error}^</p^>}
echo           ^</div^>
echo         ^</div^>
echo       ^)}
echo.
echo       {^!showAuth ^&^& (
echo         ^<div style={styles.content}^>
echo           {view === 'templates' ^&^& (
echo             ^<div^>
echo               ^<h2 style={styles.viewTitle}^>Your Templates^</h2^>
echo               ^<button 
echo                 onClick={^(^) =^> setView('create'^)}
echo                 style={styles.primaryBtn}
echo               ^>
echo                 + New Template
echo               ^</button^>
echo               {loading ^&^& ^<p^>Loading...^</p^>}
echo               {templates.length === 0 ? (
echo                 ^<p^>No templates yet. Create your first one!^</p^>
echo               ^) : (
echo                 ^<div style={styles.grid}^>
echo                   {templates.map(tpl =^> (
echo                     ^<div 
echo                       key={tpl.id} 
echo                       style={styles.templateCard}
echo                       onClick={^(^) =^> {
echo                         setCurrentTemplate(tpl^);
echo                         setElements(tpl.elements ^|^| []^);
echo                         setView('designer'^);
echo                       }}
echo                     ^>
echo                       ^<h3^>{tpl.name}^</h3^>
echo                       ^<p^>{tpl.width}×{tpl.height}mm^</p^>
echo                     ^</div^>
echo                   ^)^)}
echo                 ^</div^>
echo               ^)}
echo             ^</div^>
echo           ^)}
echo           {view === 'designer' ^&^& currentTemplate ^&^& (
echo             ^<div^>
echo               ^<h2^>{currentTemplate.name}^</h2^>
echo               ^<button onClick={saveTemplate}^>Save^</button^>
echo               ^<button onClick={^(^) =^> setView('templates'^)}^>Back^</button^>
echo               ^<button onClick={addTextElement}^>Add Text^</button^>
echo               ^<Stage width={500} height={600}^>
echo                 ^<Layer^>
echo                   ^<Rect width={500} height={600} fill="#ffffff" /^>
echo                   {elements.map(el =^> (
echo                     ^<Text
echo                       key={el.id}
echo                       x={el.x}
echo                       y={el.y}
echo                       text={el.text}
echo                       fontSize={el.fontSize}
echo                       fill={el.fill}
echo                       draggable
echo                       onClick={^(^) =^> setSelectedElement(el.id^)}
echo                       onDragEnd={(e^) =^> {
echo                         updateElement(el.id, {
echo                           x: e.target.x(^),
echo                           y: e.target.y(^)
echo                         }^);
echo                       }}
echo                     /^>
echo                   ^)^)}
echo                 ^</Layer^>
echo               ^</Stage^>
echo               {selectedElement ^&^& (
echo                 ^<div^>
echo                   ^<input
echo                     type="text"
echo                     value={elements.find(e =^> e.id === selectedElement^)?.text ^|^| ''}
echo                     onChange={(e^) =^> updateElement(selectedElement, { text: e.target.value }^)}
echo                   /^>
echo                   ^<button onClick={^(^) =^> deleteElement(selectedElement^)}^>Delete^</button^>
echo                 ^</div^>
echo               ^)}
echo             ^</div^>
echo           ^)}
echo         ^</div^>
echo       ^)}
echo     ^</div^>
echo   ^);
echo }
echo.
echo const styles = {
echo   container: { minHeight: '100vh', background: '#0f172a', color: '#e2e8f0', fontFamily: 'system-ui' },
echo   header: { padding: '20px', background: '#1e293b', borderBottom: '1px solid #334155' },
echo   logo: { display: 'flex', gap: '10px', fontSize: '20px', fontWeight: 'bold' },
echo   logoIcon: { color: '#3b82f6' },
echo   logoText: { background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
echo   logoutBtn: { padding: '8px 16px', background: '#334155', border: 'none', color: '#e2e8f0', borderRadius: '6px', cursor: 'pointer' },
echo   content: { maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' },
echo   viewTitle: { fontSize: '32px', fontWeight: 'bold', color: '#f1f5f9' },
echo   primaryBtn: { padding: '10px 20px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
echo   grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' },
echo   templateCard: { background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', cursor: 'pointer' },
echo   templateName: { fontSize: '16px', fontWeight: '600', color: '#f1f5f9', margin: '10px 0 0 0' },
echo   input: { width: '100%', padding: '12px', background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', borderRadius: '8px', marginBottom: '12px', boxSizing: 'border-box' },
echo   authScreen: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' },
echo   authCard: { background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '380px' },
echo   authTitle: { fontSize: '28px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#f1f5f9' },
echo   authSubtitle: { fontSize: '14px', color: '#94a3b8', margin: '0 0 24px 0' },
echo   authBtn: { width: '100%', padding: '12px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginTop: '16px' },
echo   errorText: { color: '#f87171', fontSize: '13px', marginTop: '12px', textAlign: 'center' }
echo };
) > src\LabelDesignerApp.jsx

echo OK - Component created

REM Start development server
echo [5/5] Starting development server...
echo.
echo ===============================================================
echo   APP READY - Opening in browser...
echo ===============================================================
echo.
echo API should be running at: http://localhost:8000/docs
echo App will open at: http://localhost:3000
echo.
echo TEST WORKFLOW:
echo   1. Login with your credentials
echo   2. Create a new template
echo   3. Add text elements
echo   4. Drag elements around
echo   5. Save template
echo.

timeout /t 3

call npm start

pause