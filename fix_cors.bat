@echo off
setlocal

echo.
echo ============================================
echo   FIXING CORS ON API
echo ============================================
echo.

echo [1] Adding CORS middleware to API...

docker exec snowwhite-api python << 'PYTHON'
import re

# Read main.py
with open('/app/main.py', 'r') as f:
    content = f.read()

# Check if CORS is already set up
if 'CORSMiddleware' in content:
    print("CORS middleware already present, updating origins...")
    # Replace existing CORS config
    pattern = r'app\.add_middleware\(\s*CORSMiddleware.*?\)'
    new_cors = '''app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)'''
    content = re.sub(pattern, new_cors, content, flags=re.DOTALL)
else:
    print("Adding CORS middleware...")
    # Add import
    if 'from fastapi.middleware.cors import CORSMiddleware' not in content:
        content = content.replace(
            'from fastapi import',
            'from fastapi.middleware.cors import CORSMiddleware\nfrom fastapi import'
        )
    
    # Add middleware after app creation
    cors_block = '''
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
'''
    # Find app = FastAPI(...) and add CORS after
    content = re.sub(
        r'(app\s*=\s*FastAPI\([^)]*\))',
        r'\1\n' + cors_block,
        content,
        count=1
    )

# Write back
with open('/app/main.py', 'w') as f:
    f.write(content)

print("DONE - main.py updated")
print()
print("First 30 lines of main.py:")
print("=" * 50)
print('\n'.join(content.split('\n')[:30]))

PYTHON

echo.
echo [2] Restarting API container...
docker restart snowwhite-api

echo.
echo Waiting 5 seconds for API to restart...
timeout /t 5 /nobreak >nul

echo.
echo [3] Testing CORS preflight...
curl -X OPTIONS http://localhost:8000/api/v1/auth/login ^
  -H "Origin: http://localhost:3001" ^
  -H "Access-Control-Request-Method: POST" ^
  -H "Access-Control-Request-Headers: Content-Type" ^
  -i

echo.
echo.
echo ============================================
echo   DONE - Now refresh http://localhost:3001
echo   and try login with:
echo   Email:    admin@admin.com
echo   Password: admin123
echo ============================================
echo.
pause >nul