#!/usr/bin/env python3
"""
Automated Label Designer Integration Script
Integrates template backend into existing SnowWhite project
Run: python setup_label_designer.py
"""

import os
from pathlib import Path


def add_model_to_database_models():
    """Add Template model to database_models.py"""
    base_path = Path('/app')
    db_models_path = base_path / 'app' / 'database_models.py'
    
    with open(db_models_path, 'r') as f:
        content = f.read()
    
    # Check if already added
    if 'class Template(Base)' in content:
        print("OK - Template model already in database_models.py")
        return
    
    template_model = '''

class Template(Base):
    """Label design template"""
    __tablename__ = "templates"

    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("user.id"), nullable=False)
    organization_id = Column(String(50), ForeignKey("organization.id"), nullable=False)

    # Template info
    name = Column(String(255), nullable=False)
    description = Column(String(500), nullable=True)

    # Dimensions (in mm)
    width = Column(Float, default=210)
    height = Column(Float, default=297)

    # Label format
    label_format = Column(String(50), default="a4_6up")

    # Elements (stored as JSON string)
    elements = Column(Text, default="[]")

    # Metadata
    is_default = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Template(id={self.id}, name={self.name})>"
'''
    
    # Add required imports
    if 'from datetime import datetime' not in content:
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('from'):
                lines.insert(i, 'from datetime import datetime')
                break
        content = '\n'.join(lines)
    
    content += template_model
    
    with open(db_models_path, 'w') as f:
        f.write(content)
    
    print("OK - Added Template model to database_models.py")


def add_schemas():
    """Add template schemas to schemas.py"""
    base_path = Path('/app')
    schemas_path = base_path / 'app' / 'schemas.py'
    
    with open(schemas_path, 'r') as f:
        content = f.read()
    
    # Check if already added
    if 'class TemplateCreate' in content:
        print("OK - Template schemas already in schemas.py")
        return
    
    template_schemas = '''

class TemplateCreate(BaseModel):
    """Schema for creating a template"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    width: float = Field(default=210, gt=0)
    height: float = Field(default=297, gt=0)
    label_format: str = Field(default="a4_6up")
    elements: Optional[list] = Field(default_factory=list)


class TemplateUpdate(BaseModel):
    """Schema for updating a template"""
    name: Optional[str] = None
    description: Optional[str] = None
    width: Optional[float] = None
    height: Optional[float] = None
    label_format: Optional[str] = None
    elements: Optional[list] = None


class TemplateResponse(BaseModel):
    """Schema for template response"""
    id: str
    name: str
    description: Optional[str]
    width: float
    height: float
    label_format: str
    elements: list
    is_default: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    """Schema for list of templates"""
    templates: list
    total_count: int
'''
    
    content += template_schemas
    
    with open(schemas_path, 'w') as f:
        f.write(content)
    
    print("OK - Added Template schemas to schemas.py")


def create_templates_endpoints():
    """Create templates API endpoints file"""
    base_path = Path('/app')
    endpoints_path = base_path / 'app' / 'api' / 'v1' / 'templates.py'
    
    if endpoints_path.exists():
        print("OK - templates.py already exists")
        return
    
    endpoints_code = '''"""Template API endpoints for label designer"""
from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
import json
import uuid

from app.database_models import Template, User
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import (
    TemplateCreate,
    TemplateUpdate,
    TemplateResponse,
    TemplateListResponse,
)

router = APIRouter(prefix="/api/v1/templates", tags=["templates"])


@router.post("", response_model=TemplateResponse)
async def create_template(
    template: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Create a new label template"""
    try:
        template_id = f"tpl_{uuid.uuid4().hex[:12]}"
        elements_json = json.dumps(template.elements or [])
        
        db_template = Template(
            id=template_id,
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            name=template.name,
            description=template.description,
            width=template.width,
            height=template.height,
            label_format=template.label_format,
            elements=elements_json,
        )
        
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        
        db_template.elements = json.loads(db_template.elements)
        return TemplateResponse.model_validate(db_template)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("", response_model=TemplateListResponse)
async def list_templates(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """List all templates for current user"""
    try:
        templates = db.query(Template).filter(
            Template.user_id == current_user.id
        ).order_by(Template.created_at.desc()).all()
        
        for t in templates:
            t.elements = json.loads(t.elements)
        
        template_responses = [TemplateResponse.model_validate(t) for t in templates]
        
        return TemplateListResponse(
            templates=template_responses,
            total_count=len(templates),
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/{template_id}", response_model=TemplateResponse)
async def get_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Get a specific template"""
    try:
        template = db.query(Template).filter(
            Template.id == template_id,
            Template.user_id == current_user.id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        template.elements = json.loads(template.elements)
        return TemplateResponse.model_validate(template)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.put("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: str,
    template: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Update a template"""
    try:
        db_template = db.query(Template).filter(
            Template.id == template_id,
            Template.user_id == current_user.id
        ).first()
        
        if not db_template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        if template.name:
            db_template.name = template.name
        if template.description is not None:
            db_template.description = template.description
        if template.width:
            db_template.width = template.width
        if template.height:
            db_template.height = template.height
        if template.label_format:
            db_template.label_format = template.label_format
        if template.elements is not None:
            db_template.elements = json.dumps(template.elements)
        
        db_template.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_template)
        
        db_template.elements = json.loads(db_template.elements)
        return TemplateResponse.model_validate(db_template)
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.delete("/{template_id}")
async def delete_template(
    template_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Delete a template"""
    try:
        template = db.query(Template).filter(
            Template.id == template_id,
            Template.user_id == current_user.id
        ).first()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        db.delete(template)
        db.commit()
        
        return {"message": "Template deleted", "template_id": template_id}
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
'''
    
    os.makedirs(endpoints_path.parent, exist_ok=True)
    with open(endpoints_path, 'w') as f:
        f.write(endpoints_code)
    
    print("OK - Created templates.py endpoints")


def update_main_py():
    """Update main.py to include templates router"""
    base_path = Path('/app')
    main_path = base_path / 'main.py'
    
    with open(main_path, 'r') as f:
        content = f.read()
    
    # Add import if not present
    if 'from app.api.v1 import templates' not in content:
        content = content.replace(
            'from app.api.v1 import',
            'from app.api.v1 import templates, '
        )
    
    # Add router if not present
    if 'app.include_router(templates.router)' not in content:
        content = content.replace(
            'app.include_router(batch_labels.router)',
            'app.include_router(batch_labels.router)\napp.include_router(templates.router)'
        )
    
    with open(main_path, 'w') as f:
        f.write(content)
    
    print("OK - Updated main.py")


def main():
    """Run complete integration"""
    print("")
    print("=" * 60)
    print("  LABEL DESIGNER - BACKEND INTEGRATION")
    print("=" * 60)
    print("")
    
    print("[1/4] Adding Template model...")
    add_model_to_database_models()
    
    print("[2/4] Adding Template schemas...")
    add_schemas()
    
    print("[3/4] Creating templates endpoints...")
    create_templates_endpoints()
    
    print("[4/4] Updating main.py...")
    update_main_py()
    
    print("")
    print("=" * 60)
    print("  BACKEND INTEGRATION COMPLETE")
    print("=" * 60)
    print("")
    print("New endpoints available:")
    print("  POST   /api/v1/templates")
    print("  GET    /api/v1/templates")
    print("  GET    /api/v1/templates/{template_id}")
    print("  PUT    /api/v1/templates/{template_id}")
    print("  DELETE /api/v1/templates/{template_id}")
    print("")


if __name__ == "__main__":
    main()