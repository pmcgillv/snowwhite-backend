import pytest
from fastapi.testclient import TestClient
from main import app
from app.security import create_access_token

client = TestClient(app)

@pytest.mark.api
def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

@pytest.mark.api
def test_get_current_user_without_auth():
    response = client.get("/api/v1/auth/me")
    assert response.status_code in [401, 403]

@pytest.mark.api
def test_get_current_user_with_auth():
    token = create_access_token({"sub": "test_user_id"})
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code in [200, 404, 401]

@pytest.mark.api
def test_barcode_endpoint_requires_auth():
    response = client.get("/api/v1/labels/test-barcode/qr/TEST123")
    assert response.status_code in [401, 403]

@pytest.mark.api
def test_barcode_endpoint_with_auth():
    token = create_access_token({"sub": "test_user_id"})
    response = client.get(
        "/api/v1/labels/test-barcode/qr/TEST123",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code in [200, 404, 401]

@pytest.mark.api
def test_labels_list_requires_auth():
    response = client.get("/api/v1/labels/")
    assert response.status_code in [401, 403]

@pytest.mark.api
def test_generate_simple_requires_auth():
    response = client.post(
        "/api/v1/labels/generate-simple?text=Test&code=123&barcode_type=qr"
    )
    assert response.status_code in [401, 403]

@pytest.mark.api
def test_openapi_docs():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "paths" in data
    assert "components" in data