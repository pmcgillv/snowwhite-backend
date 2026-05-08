import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.database_models import Organization, User
from app.dependencies import generate_id
from app.security import hash_password

TEST_DATABASE_URL = "sqlite:///test.db"

@pytest.fixture(scope="session")
def test_db_engine():
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("test.db"):
        os.remove("test.db")

@pytest.fixture(scope="function")
def test_db_session(test_db_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_db_engine)
    Base.metadata.create_all(bind=test_db_engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=test_db_engine)

@pytest.fixture(scope="function")
def test_org(test_db_session):
    org = Organization(id=generate_id(), name="Test Org", slug="test-org")
    test_db_session.add(org)
    test_db_session.commit()
    return org

@pytest.fixture(scope="function")
def test_user(test_db_session, test_org):
    user = User(
        id=generate_id(),
        email="test@example.com",
        full_name="Test User",
        password_hash=hash_password("TestPassword123!"),
        organization_id=test_org.id,
        role="admin",
        is_active=True
    )
    test_db_session.add(user)
    test_db_session.commit()
    return user

@pytest.fixture(scope="function")
def test_user_data():
    return {
        "email": "newuser@example.com",
        "password": "TestPassword123!",
        "full_name": "New User",
        "organization_name": "New Org"
    }

def pytest_configure(config):
    config.addinivalue_line("markers", "auth: mark test as authentication test")
    config.addinivalue_line("markers", "barcode: mark test as barcode test")
    config.addinivalue_line("markers", "pdf: mark test as PDF test")
    config.addinivalue_line("markers", "db: mark test as database test")
    config.addinivalue_line("markers", "api: mark test as API test")
    config.addinivalue_line("markers", "integration: mark test as integration test")
