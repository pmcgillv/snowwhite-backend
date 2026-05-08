import pytest
from app.security import hash_password, verify_password, create_access_token, verify_token

@pytest.mark.auth
def test_hash_password():
    pwd = "TestPassword123!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert len(hashed) > 20

@pytest.mark.auth
def test_verify_password_correct():
    pwd = "TestPassword123!"
    hashed = hash_password(pwd)
    assert verify_password(pwd, hashed) == True

@pytest.mark.auth
def test_verify_password_incorrect():
    pwd = "TestPassword123!"
    hashed = hash_password(pwd)
    assert verify_password("WrongPassword", hashed) == False

@pytest.mark.auth
def test_create_access_token():
    token = create_access_token({"sub": "user123"})
    assert token is not None
    assert isinstance(token, str)
    assert len(token) > 50

@pytest.mark.auth
def test_verify_token_valid():
    token = create_access_token({"sub": "user123"})
    payload = verify_token(token)
    assert payload is not None
    assert payload["sub"] == "user123"

@pytest.mark.auth
def test_verify_token_invalid():
    payload = verify_token("invalid.token.here")
    assert payload is None

@pytest.mark.auth
def test_verify_token_expired():
    from datetime import datetime, timedelta, timezone
    from app.config import settings
    from jose import jwt
    
    expired_payload = {
        "sub": "user123",
        "exp": datetime.now(timezone.utc) - timedelta(hours=1)
    }
    expired_token = jwt.encode(expired_payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    payload = verify_token(expired_token)
    assert payload is None
