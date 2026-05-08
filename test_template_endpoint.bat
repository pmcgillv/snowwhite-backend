@echo off
setlocal

set TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJlZjQxNGZkNi0zMzhhLTQyZDItOGRlOC1lMTkxNGI3ZDc0NjYiLCJleHAiOjE3NzgyMDQ2MTV9.iBh1xKBrfcxfeYolAreQCzJkZ1UhsIcE9CNidFc_UCk

echo.
echo ================================================
echo   TESTING TEMPLATE ENDPOINT
echo ================================================
echo.

echo Testing POST /api/v1/templates...
echo.

curl -X POST http://localhost:8000/api/v1/templates/ ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test Label\",\"width\":210,\"height\":297,\"label_format\":\"a4_6up\",\"elements\":[]}" ^
  -i

echo.
echo.
pause