@echo off
REM Create test user with correct schema

echo Creating test user...

docker exec snowwhite-api python << 'PYTHON'
try:
    from sqlalchemy import create_engine, text
    from passlib.context import CryptContext
    import uuid
    
    db_url = "postgresql://snowwhite:snowwhite@snowwhite-db:5432/snowwhite"
    engine = create_engine(db_url)
    
    pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
    hashed = pwd_context.hash('test123')
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    org_id = f"org_{uuid.uuid4().hex[:12]}"
    
    with engine.connect() as conn:
        # Insert organization
        conn.execute(text("""
            INSERT INTO organizations (id, name, domain)
            VALUES (:org_id, 'Test Org', 'test.com')
            ON CONFLICT (id) DO NOTHING
        """), {"org_id": org_id})
        
        # Insert user with correct columns
        conn.execute(text("""
            INSERT INTO users (id, email, full_name, password_hash, organization_id, role, is_active, created_at)
            VALUES (:user_id, 'test@example.com', 'Test User', :password_hash, :org_id, 'user', true, NOW())
            ON CONFLICT (id) DO NOTHING
        """), {
            "user_id": user_id,
            "password_hash": hashed,
            "org_id": org_id
        })
        
        conn.commit()
    
    print("SUCCESS!")
    print("Email: test@example.com")
    print("Password: test123")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

PYTHON

echo.
pause