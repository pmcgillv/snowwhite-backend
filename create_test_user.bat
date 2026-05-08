@echo off
REM Create test user in database

echo.
echo ===============================================================
echo   CREATE TEST USER
echo ===============================================================
echo.

echo Creating test user in database...

docker exec snowwhite-api python -c "from app.database import SessionLocal; from app.database_models import Organization, User; from app.security import get_password_hash; import uuid; db = SessionLocal(); org = db.query(Organization).filter(Organization.name == 'Test Org').first(); org = org or Organization(id=f'org_{uuid.uuid4().hex[:12]}', name='Test Org', domain='test.com'); db.add(org) if not db.query(Organization).filter(Organization.name == 'Test Org').first() else None; db.commit(); user = db.query(User).filter(User.email == 'demo@test.com').first(); user = user or User(id=f'user_{uuid.uuid4().hex[:12]}', email='demo@test.com', hashed_password=get_password_hash('demo123'), organization_id=org.id, name='Demo User'); db.add(user) if not db.query(User).filter(User.email == 'demo@test.com').first() else None; db.commit(); print('OK - User ready')"

echo.
echo ===============================================================
echo   LOGIN CREDENTIALS
echo ===============================================================
echo.
echo Email: demo@test.com
echo Password: demo123
echo.
echo Use these in the frontend login screen at:
echo   http://localhost:3000
echo.

pause