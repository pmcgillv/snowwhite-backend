"""Tests for label template designer feature"""
import pytest
import json
from app.database_models import Template
from sqlalchemy.orm import Session


@pytest.fixture
def sample_elements():
    """Sample template elements"""
    return [
        {
            "id": "text_1",
            "type": "text",
            "content": "Product Name",
            "x": 10,
            "y": 10,
            "width": 80,
            "height": 20,
            "fontSize": 16,
            "color": "#000000",
            "fontFamily": "Arial",
            "rotation": 0,
            "opacity": 1
        },
        {
            "id": "barcode_1",
            "type": "barcode",
            "x": 10,
            "y": 40,
            "width": 60,
            "height": 40,
            "barcodeType": "qr",
            "dataSource": "code"
        }
    ]


@pytest.mark.template
def test_create_template(client, test_user, sample_elements):
    """Test creating a new template"""
    response = client.post(
        "/api/v1/templates",
        json={
            "name": "Product Labels",
            "description": "Standard product label template",
            "width": 210,
            "height": 297,
            "label_format": "a4_6up",
            "elements": sample_elements
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Product Labels"
    assert data["width"] == 210
    assert data["height"] == 297
    assert len(data["elements"]) == 2
    assert "id" in data


@pytest.mark.template
def test_create_template_requires_auth(client):
    """Test that creating template requires authentication"""
    response = client.post(
        "/api/v1/templates",
        json={
            "name": "Test Template",
            "width": 210,
            "height": 297
        }
    )
    
    assert response.status_code in [401, 403]


@pytest.mark.template
def test_create_template_minimal(client, test_user):
    """Test creating template with minimal fields"""
    response = client.post(
        "/api/v1/templates",
        json={
            "name": "Minimal Template"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Minimal Template"
    assert data["width"] == 210  # Default
    assert data["height"] == 297  # Default


@pytest.mark.template
def test_create_template_empty_name(client, test_user):
    """Test that empty template name is rejected"""
    response = client.post(
        "/api/v1/templates",
        json={
            "name": "",
            "width": 210
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.template
def test_list_templates(client, test_user, sample_elements):
    """Test listing all templates for user"""
    # Create 3 templates
    for i in range(3):
        client.post(
            "/api/v1/templates",
            json={
                "name": f"Template {i}",
                "width": 210,
                "height": 297,
                "elements": sample_elements
            },
            headers={"Authorization": f"Bearer {test_user['token']}"}
        )
    
    # List templates
    response = client.get(
        "/api/v1/templates",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] >= 3
    assert len(data["templates"]) >= 3


@pytest.mark.template
def test_list_templates_requires_auth(client):
    """Test that listing templates requires authentication"""
    response = client.get("/api/v1/templates")
    
    assert response.status_code in [401, 403]


@pytest.mark.template
def test_list_templates_empty(client, test_user):
    """Test listing templates when none exist"""
    response = client.get(
        "/api/v1/templates",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] >= 0
    assert isinstance(data["templates"], list)


@pytest.mark.template
def test_get_template(client, test_user, sample_elements):
    """Test getting a specific template"""
    # Create template
    create_response = client.post(
        "/api/v1/templates",
        json={
            "name": "Get Test Template",
            "elements": sample_elements
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    template_id = create_response.json()["id"]
    
    # Get template
    response = client.get(
        f"/api/v1/templates/{template_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == template_id
    assert data["name"] == "Get Test Template"
    assert len(data["elements"]) == 2


@pytest.mark.template
def test_get_template_not_found(client, test_user):
    """Test getting non-existent template"""
    response = client.get(
        "/api/v1/templates/nonexistent_id",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 404


@pytest.mark.template
def test_get_template_requires_auth(client):
    """Test that getting template requires authentication"""
    response = client.get("/api/v1/templates/some_id")
    
    assert response.status_code in [401, 403]


@pytest.mark.template
def test_update_template(client, test_user, sample_elements):
    """Test updating a template"""
    # Create template
    create_response = client.post(
        "/api/v1/templates",
        json={
            "name": "Original Name",
            "elements": sample_elements
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    template_id = create_response.json()["id"]
    
    # Update template
    response = client.put(
        f"/api/v1/templates/{template_id}",
        json={
            "name": "Updated Name",
            "description": "New description"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["description"] == "New description"


@pytest.mark.template
def test_update_template_elements(client, test_user, sample_elements):
    """Test updating template elements"""
    # Create template
    create_response = client.post(
        "/api/v1/templates",
        json={
            "name": "Elements Test",
            "elements": sample_elements[:1]  # Only 1 element
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    template_id = create_response.json()["id"]
    
    # Update with more elements
    response = client.put(
        f"/api/v1/templates/{template_id}",
        json={
            "elements": sample_elements  # Both elements
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["elements"]) == 2


@pytest.mark.template
def test_update_template_not_found(client, test_user):
    """Test updating non-existent template"""
    response = client.put(
        "/api/v1/templates/nonexistent_id",
        json={"name": "New Name"},
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 404


@pytest.mark.template
def test_delete_template(client, test_user, sample_elements):
    """Test deleting a template"""
    # Create template
    create_response = client.post(
        "/api/v1/templates",
        json={
            "name": "Delete Me",
            "elements": sample_elements
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    template_id = create_response.json()["id"]
    
    # Delete template
    response = client.delete(
        f"/api/v1/templates/{template_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    
    # Verify deleted
    get_response = client.get(
        f"/api/v1/templates/{template_id}",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert get_response.status_code == 404


@pytest.mark.template
def test_delete_template_not_found(client, test_user):
    """Test deleting non-existent template"""
    response = client.delete(
        "/api/v1/templates/nonexistent_id",
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 404


@pytest.mark.template
def test_template_dimensions(client, test_user):
    """Test creating template with custom dimensions"""
    response = client.post(
        "/api/v1/templates",
        json={
            "name": "Custom Size",
            "width": 100,
            "height": 150,
            "label_format": "custom"
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["width"] == 100
    assert data["height"] == 150
    assert data["label_format"] == "custom"


@pytest.mark.template
def test_template_model(test_org, test_user_obj, db: Session, sample_elements):
    """Test Template model creation"""
    template = Template(
        id="test_template_123",
        user_id=test_user_obj.id,
        organization_id=test_org.id,
        name="Model Test Template",
        description="Testing template model",
        width=210,
        height=297,
        label_format="a4_6up",
        elements=json.dumps(sample_elements),
    )
    
    db.add(template)
    db.commit()
    
    retrieved = db.query(Template).filter(Template.id == "test_template_123").first()
    assert retrieved is not None
    assert retrieved.name == "Model Test Template"
    assert json.loads(retrieved.elements) == sample_elements


@pytest.mark.template
def test_template_json_elements(test_org, test_user_obj, db: Session):
    """Test that template elements are properly JSON serialized"""
    elements = [
        {"id": "text_1", "type": "text", "content": "Test"},
        {"id": "shape_1", "type": "shape", "shapeType": "rectangle"}
    ]
    
    template = Template(
        id="json_test",
        user_id=test_user_obj.id,
        organization_id=test_org.id,
        name="JSON Test",
        elements=json.dumps(elements),
    )
    
    db.add(template)
    db.commit()
    
    retrieved = db.query(Template).filter(Template.id == "json_test").first()
    parsed_elements = json.loads(retrieved.elements)
    
    assert len(parsed_elements) == 2
    assert parsed_elements[0]["type"] == "text"
    assert parsed_elements[1]["shapeType"] == "rectangle"


@pytest.mark.template
def test_template_large_elements_array(client, test_user):
    """Test creating template with many elements"""
    # Create 50 elements
    elements = [
        {
            "id": f"element_{i}",
            "type": "text",
            "content": f"Element {i}",
            "x": i * 10,
            "y": i * 10,
            "width": 50,
            "height": 20
        }
        for i in range(50)
    ]
    
    response = client.post(
        "/api/v1/templates",
        json={
            "name": "Large Template",
            "elements": elements
        },
        headers={"Authorization": f"Bearer {test_user['token']}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data["elements"]) == 50