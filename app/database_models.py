from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String(36), primary_key=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    full_name = Column(String(255))
    password_hash = Column(String(255))
    organization_id = Column(String(36), ForeignKey("organizations.id"))
    role = Column(String(50), default="member")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Template(Base):
    __tablename__ = "templates"
    id = Column(String(36), primary_key=True)
    name = Column(String(255))
    organization_id = Column(String(36), ForeignKey("organizations.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"
    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"))
    name = Column(String(255))
    status = Column(String(50), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

class Integration(Base):
    __tablename__ = "integrations"
    id = Column(String(36), primary_key=True)
    organization_id = Column(String(36), ForeignKey("organizations.id"))
    type = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)




class BatchJob(Base):
    """Batch label processing job tracker"""
    __tablename__ = "batch_jobs"

    # Primary key & foreign keys
    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("users.id"), nullable=False)
    organization_id = Column(String(50), ForeignKey("organizations.id"), nullable=False)

    # Job configuration
    filename = Column(String(255), nullable=False)
    barcode_type = Column(String(20), nullable=False)
    page_size = Column(String(20), default="a4")
    labels_per_page = Column(Integer, default=6)

    # Progress tracking
    status = Column(String(20), default="pending")
    total_rows = Column(Integer, default=0)
    processed_rows = Column(Integer, default=0)
    progress_percent = Column(Integer, default=0)

    # Results
    output_filename = Column(String(255), nullable=True)
    output_path = Column(String(500), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Error tracking
    error_message = Column(String(1000), nullable=True)
    failed_rows = Column(Integer, default=0)

    def __repr__(self):
        return f"<BatchJob(id={self.id}, status={self.status})>"
