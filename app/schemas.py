from datetime import datetime
from pydantic import BaseModel, Field, EmailStr
from typing import Optional

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization_name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"




class BatchJobCreate(BaseModel):
    """Schema for creating a new batch job"""
    barcode_type: str = Field(..., description="qr, code128, ean13, or upca")
    page_size: str = Field(default="a4", description="a4 or letter")
    labels_per_page: int = Field(default=6, ge=1, le=30)


class BatchJobProgress(BaseModel):
    """Schema for job progress response"""
    job_id: str
    status: str
    total_rows: int
    processed_rows: int
    progress_percent: int
    started_at: Optional[datetime] = None
    estimated_completion: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class BatchJobResponse(BaseModel):
    """Schema for batch job response"""
    job_id: str
    status: str
    filename: str
    barcode_type: str
    total_rows: int
    processed_rows: int
    progress_percent: int
    created_at: datetime
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True


class BatchJobStartResponse(BaseModel):
    """Schema for batch job start response"""
    job_id: str
    status: str
    message: str
    progress_url: str


class BatchJobListResponse(BaseModel):
    """Schema for list of batch jobs"""
    jobs: list
    total_count: int
    completed_count: int
    processing_count: int


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
