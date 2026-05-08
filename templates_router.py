from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.database_models import Template
from app.schemas import TemplateCreate, TemplateUpdate
from app.dependencies import get_current_user
from typing import List
import uuid

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def list_templates(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get all templates for current user"""
    templates = db.query(Template).filter(Template.organization_id == current_user.organization_id).all()
    return {"templates": templates}

@router.post("/")
def create_template(template: TemplateCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Create new template"""
    new_template = Template(
        id=str(uuid.uuid4()),
        name=template.name,
        width=template.width,
        height=template.height,
        label_format=template.label_format,
        elements=template.elements or [],
        organization_id=current_user.organization_id
    )
    db.add(new_template)
    db.commit()
    db.refresh(new_template)
    return new_template

@router.get("/{template_id}")
def get_template(template_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Get specific template"""
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.organization_id == current_user.organization_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.put("/{template_id}")
def update_template(template_id: str, template: TemplateUpdate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Update template"""
    db_template = db.query(Template).filter(
        Template.id == template_id,
        Template.organization_id == current_user.organization_id
    ).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    if template.name:
        db_template.name = template.name
    if template.elements is not None:
        db_template.elements = template.elements
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    """Delete template"""
    db_template = db.query(Template).filter(
        Template.id == template_id,
        Template.organization_id == current_user.organization_id
    ).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(db_template)
    db.commit()
    return {"message": "Template deleted"}