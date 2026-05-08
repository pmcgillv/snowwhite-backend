@echo off
docker exec snowwhite-api python << 'PYTHON'
from app.database import SessionLocal
from app.database_models import User
db = SessionLocal()
user = db.query(User).filter(User.email == 'demo@test.com').first()
if user:
    print(f"Email: {user.email}")
    print(f"Active: {user.is_active}")
    print(f"Hash: {user.password_hash[:40]}...")
else:
    print("NOT FOUND")
PYTHON
pause