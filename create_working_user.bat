@echo off
REM Create working test user

echo Creating user: work@test.com with password: work123

docker exec snowwhite-api python << 'PYTHON'
from app.database import SessionLocal
from app.database_models import User
from passlib.context import CryptContext
import uuid

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

db = SessionLocal()

# Delete if exists
existing = db.query(User).filter(User.email == 'work@test.com').first()
if existing:
    db.delete(existing)
    db.commit()

# Create new user
user = User(
    id=f"user_{uuid.uuid4().hex[:12]}",
    email='work@test.com',
    full_name='Work User',
    password_hash=pwd_context.hash('work123'),
    organization_id='org_test',
    role='user',
    is_active=True
)

db.add(user)
db.commit()

print("SUCCESS!")
print("Email: work@test.com")
print("Password: work123")

PYTHON

echo.
pause