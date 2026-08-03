"""Verify Phase 2, QR code, and PDF/barcode routers are registered in main."""
import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


@pytest.mark.api
def test_phase2_health_endpoint():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["phase"] == "Phase 2"


@pytest.mark.api
def test_qrcode_create_and_list():
    doc_id = "test-doc-1"
    create_response = client.post(
        f"/api/v1/qrcodes/documents/{doc_id}/create",
        json={"data": "https://example.com", "position": {"x": 10, "y": 20}},
    )
    assert create_response.status_code == 200
    qr = create_response.json()
    assert qr["current_data"] == "https://example.com"

    list_response = client.get(f"/api/v1/qrcodes/documents/{doc_id}")
    assert list_response.status_code == 200
    data = list_response.json()
    assert data["total"] == 1


@pytest.mark.api
def test_pdf_barcode_supported_formats():
    response = client.get("/api/v1/documents/supported-formats")
    assert response.status_code == 200
    data = response.json()
    assert "code128" in data["formats"]
    assert "qr" in data["formats"]


@pytest.mark.api
def test_openapi_includes_new_routes():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/v1/qrcodes/documents/{document_id}/create" in paths
    assert "/api/v1/templates/{template_id}/import/upload" in paths
    assert "/api/v1/documents/upload-pdf" in paths
