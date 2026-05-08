#!/usr/bin/env python3
"""
Automated Batch Processing Integration Script
Integrates all batch processing files into existing SnowWhite project
Run: python setup_batch_processing.py
"""

import os
import shutil
from pathlib import Path


def add_to_file(filepath: str, content: str, marker: str = None):
    """Add content to end of file before closing import or class"""
    with open(filepath, 'r') as f:
        original = f.read()
    
    # Add if not already present
    if content.strip() in original:
        print(f"✓ {filepath} - already contains batch processing code")
        return
    
    # Find insertion point
    if marker:
        lines = original.split('\n')
        insert_pos = len(lines) - 1
        for i, line in enumerate(lines):
            if marker in line:
                insert_pos = i + 1
                break
        lines.insert(insert_pos, content)
        modified = '\n'.join(lines)
    else:
        modified = original + '\n\n' + content
    
    with open(filepath, 'w') as f:
        f.write(modified)
    print(f"✓ {filepath} - updated")


def main():
    """Run complete integration"""
    
    base_path = Path('/app')
    
    print("\n" + "="*60)
    print("  BATCH PROCESSING AUTOMATION - FULL INTEGRATION")
    print("="*60 + "\n")
    
    # 1. Add BatchJob model to database_models.py
    print("[1/6] Adding BatchJob model to database_models.py...")
    batch_job_model = '''

class BatchJob(Base):
    """Batch label processing job tracker"""
    __tablename__ = "batch_jobs"

    # Primary key & foreign keys
    id = Column(String(50), primary_key=True)
    user_id = Column(String(50), ForeignKey("user.id"), nullable=False)
    organization_id = Column(String(50), ForeignKey("organization.id"), nullable=False)

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
'''
    
    # Ensure datetime import
    db_models_path = base_path / 'app' / 'database_models.py'
    with open(db_models_path, 'r') as f:
        content = f.read()
    
    if 'from datetime import datetime' not in content:
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('from'):
                lines.insert(i, 'from datetime import datetime')
                break
        content = '\n'.join(lines)
        with open(db_models_path, 'w') as f:
            f.write(content)
    
    add_to_file(str(db_models_path), batch_job_model)
    
    # 2. Add schemas
    print("[2/6] Adding batch job schemas to schemas.py...")
    batch_schemas = '''

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
'''
    
    schemas_path = base_path / 'app' / 'schemas.py'
    with open(schemas_path, 'r') as f:
        schema_content = f.read()
    
    # Add datetime import if needed
    if 'from datetime import datetime' not in schema_content:
        lines = schema_content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('from'):
                lines.insert(i, 'from datetime import datetime')
                break
        schema_content = '\n'.join(lines)
        with open(schemas_path, 'w') as f:
            f.write(schema_content)
    
    add_to_file(str(schemas_path), batch_schemas)
    
    # 3. Create batch_processor.py
    print("[3/6] Creating batch_processor.py...")
    batch_processor_code = '''"""Background worker for batch label processing"""
import threading
import time
import csv
import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.database_models import BatchJob
from app.utils.pdf import create_label_pdf
import logging

logger = logging.getLogger(__name__)


class BatchProcessor:
    """Background processor for batch label jobs"""
    
    def __init__(self):
        self.running = False
        self.db: Session = None
    
    def start(self):
        """Start the background processor in a separate thread"""
        self.running = True
        thread = threading.Thread(target=self.run, daemon=True)
        thread.start()
        logger.info("Batch processor started")
    
    def stop(self):
        """Stop the background processor"""
        self.running = False
        logger.info("Batch processor stopped")
    
    def run(self):
        """Main processing loop"""
        while self.running:
            try:
                self.db = SessionLocal()
                
                # Find next pending job
                job = self.db.query(BatchJob).filter(
                    BatchJob.status == "pending"
                ).order_by(BatchJob.created_at).first()
                
                if not job:
                    time.sleep(2)
                    continue
                
                # Process the job
                self.process_job(job)
                
            except Exception as e:
                logger.error(f"Error in batch processor: {str(e)}")
                time.sleep(5)
            finally:
                if self.db:
                    self.db.close()
    
    def process_job(self, job: BatchJob):
        """Process a single batch job"""
        try:
            job.status = "processing"
            job.started_at = datetime.utcnow()
            self.db.commit()
            logger.info(f"Started processing job {job.id}")
            
            # Read CSV file
            csv_path = f"/app/uploads/{job.id}.csv"
            if not os.path.exists(csv_path):
                raise FileNotFoundError(f"CSV file not found: {csv_path}")
            
            # Parse CSV
            labels_data = []
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    labels_data.append({
                        "text": row.get("product_name", ""),
                        "code": row.get("code", ""),
                        "description": row.get("description", "")
                    })
            
            job.total_rows = len(labels_data)
            self.db.commit()
            
            # Update progress while generating PDF
            for i in range(0, len(labels_data), 100):
                job.processed_rows = min(i + 100, len(labels_data))
                job.progress_percent = int((job.processed_rows / len(labels_data)) * 100)
                self.db.commit()
                logger.info(f"Job {job.id}: {job.progress_percent}%")
                time.sleep(0.1)
            
            # Generate final PDF
            logger.info(f"Generating final PDF for job {job.id}")
            final_pdf = create_label_pdf(
                labels=labels_data,
                barcode_type=job.barcode_type,
                page_size=job.page_size,
                labels_per_page=job.labels_per_page
            )
            
            # Save output
            output_dir = "/app/uploads/outputs"
            os.makedirs(output_dir, exist_ok=True)
            
            output_filename = f"labels_{job.id}_{datetime.utcnow().timestamp()}.pdf"
            output_path = f"{output_dir}/{output_filename}"
            
            with open(output_path, 'wb') as f:
                f.write(final_pdf.getvalue())
            
            # Mark complete
            job.output_filename = output_filename
            job.output_path = output_path
            job.status = "completed"
            job.completed_at = datetime.utcnow()
            job.progress_percent = 100
            self.db.commit()
            
            logger.info(f"Job {job.id} completed successfully")
            
        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            self.db.commit()
            logger.error(f"Job {job.id} failed: {str(e)}")


_processor = None


def start_batch_processor():
    """Start the global batch processor"""
    global _processor
    if _processor is None:
        _processor = BatchProcessor()
        _processor.start()


def stop_batch_processor():
    """Stop the global batch processor"""
    global _processor
    if _processor:
        _processor.stop()
'''
    
    processor_path = base_path / 'app' / 'utils' / 'batch_processor.py'
    os.makedirs(processor_path.parent, exist_ok=True)
    with open(processor_path, 'w') as f:
        f.write(batch_processor_code)
    print(f"✓ Created {processor_path}")
    
    # 4. Create batch API endpoints file
    print("[4/6] Creating batch_labels_endpoints.py...")
    endpoints_code = '''"""Batch label processing API endpoints"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from datetime import datetime
import csv
import os
from io import StringIO
import uuid

from app.database_models import BatchJob, User
from app.database import get_db
from app.dependencies import get_current_user
from app.schemas import (
    BatchJobProgress,
    BatchJobResponse,
    BatchJobStartResponse,
    BatchJobListResponse,
)
from app.utils.pdf import create_label_pdf

router = APIRouter(prefix="/api/v1/labels", tags=["batch"])


@router.post("/batch-upload", response_model=BatchJobStartResponse)
async def batch_upload(
    file: UploadFile = File(...),
    barcode_type: str = "qr",
    page_size: str = "a4",
    labels_per_page: int = 6,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Start a batch label generation job from CSV file."""
    try:
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be CSV format")
        
        valid_types = ["qr", "code128", "ean13", "upca"]
        if barcode_type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid barcode_type")
        
        content = await file.read()
        csv_reader = csv.DictReader(StringIO(content.decode()))
        rows = list(csv_reader)
        
        if not rows:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        if len(rows) > 100000:
            raise HTTPException(status_code=400, detail="CSV too large (max 100K rows)")
        
        job_id = f"job_{uuid.uuid4().hex[:12]}"
        
        job = BatchJob(
            id=job_id,
            user_id=current_user.id,
            organization_id=current_user.organization_id,
            filename=file.filename,
            barcode_type=barcode_type,
            page_size=page_size,
            labels_per_page=labels_per_page,
            status="pending",
            total_rows=len(rows),
        )
        
        db.add(job)
        db.commit()
        
        upload_dir = "/app/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        csv_path = f"{upload_dir}/{job_id}.csv"
        with open(csv_path, 'wb') as f:
            f.write(content)
        
        return BatchJobStartResponse(
            job_id=job_id,
            status="pending",
            message=f"Job queued. {len(rows)} labels will be processed.",
            progress_url=f"/api/v1/labels/jobs/{job_id}",
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@router.get("/jobs/{job_id}", response_model=BatchJobProgress)
async def get_job_progress(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Get progress of a batch job."""
    job = db.query(BatchJob).filter(
        BatchJob.id == job_id,
        BatchJob.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    estimated_completion = None
    if job.status == "processing" and job.started_at:
        elapsed = (datetime.utcnow() - job.started_at).total_seconds()
        if job.processed_rows > 0:
            rate = job.processed_rows / elapsed
            remaining_rows = job.total_rows - job.processed_rows
            estimated_seconds = remaining_rows / rate
            from datetime import timedelta
            estimated_completion = datetime.utcnow() + timedelta(seconds=estimated_seconds)
    
    return BatchJobProgress(
        job_id=job.id,
        status=job.status,
        total_rows=job.total_rows,
        processed_rows=job.processed_rows,
        progress_percent=job.progress_percent,
        started_at=job.started_at,
        estimated_completion=estimated_completion,
        error_message=job.error_message,
    )


@router.get("/jobs/{job_id}/download")
async def download_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Download PDF from completed batch job."""
    job = db.query(BatchJob).filter(
        BatchJob.id == job_id,
        BatchJob.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status == "pending":
        raise HTTPException(status_code=202, detail="Job queued")
    
    if job.status == "processing":
        raise HTTPException(status_code=202, detail="Job processing")
    
    if job.status == "failed":
        raise HTTPException(status_code=400, detail=f"Failed: {job.error_message}")
    
    if not job.output_path or not os.path.exists(job.output_path):
        raise HTTPException(status_code=500, detail="Output not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=job.output_path,
        filename=job.output_filename,
        media_type="application/pdf"
    )


@router.get("/jobs/", response_model=BatchJobListResponse)
async def list_jobs(
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """List all batch jobs for current user."""
    jobs = db.query(BatchJob).filter(
        BatchJob.user_id == current_user.id
    ).order_by(BatchJob.created_at.desc()).all()
    
    job_responses = [BatchJobResponse.model_validate(job) for job in jobs]
    
    completed = sum(1 for j in jobs if j.status == "completed")
    processing = sum(1 for j in jobs if j.status == "processing")
    
    return BatchJobListResponse(
        jobs=job_responses,
        total_count=len(jobs),
        completed_count=completed,
        processing_count=processing,
    )


@router.delete("/jobs/{job_id}")
async def cancel_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db = Depends(get_db),
):
    """Cancel a pending or processing job."""
    job = db.query(BatchJob).filter(
        BatchJob.id == job_id,
        BatchJob.user_id == current_user.id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel completed job")
    
    job.status = "cancelled"
    job.error_message = "Cancelled by user"
    db.commit()
    
    return {"message": "Job cancelled", "job_id": job_id}
'''
    
    endpoints_path = base_path / 'app' / 'api' / 'v1' / 'batch_labels.py'
    os.makedirs(endpoints_path.parent, exist_ok=True)
    with open(endpoints_path, 'w') as f:
        f.write(endpoints_code)
    print(f"✓ Created {endpoints_path}")
    
    # 5. Update main.py to include batch routes and processor
    print("[5/6] Updating main.py...")
    main_path = base_path / 'main.py'
    with open(main_path, 'r') as f:
        main_content = f.read()
    
    # Add import for batch processor
    if 'from app.utils.batch_processor import' not in main_content:
        main_content = main_content.replace(
            'from app.api.v1',
            'from app.utils.batch_processor import start_batch_processor, stop_batch_processor\nfrom app.api.v1'
        )
    
    # Add import for batch router
    if 'from app.api.v1 import batch_labels' not in main_content:
        main_content = main_content.replace(
            'from app.api.v1 import',
            'from app.api.v1 import batch_labels, '
        )
    
    # Add batch router to app
    if 'app.include_router(batch_labels.router)' not in main_content:
        main_content = main_content.replace(
            'app.include_router(auth.router)',
            'app.include_router(auth.router)\napp.include_router(batch_labels.router)'
        )
    
    # Add batch processor startup
    if 'start_batch_processor()' not in main_content:
        # Find where to insert (after creating tables)
        main_content = main_content.replace(
            'database_models.Base.metadata.create_all(bind=engine)',
            'database_models.Base.metadata.create_all(bind=engine)\n\n# Start batch processor\nstart_batch_processor()\n\nimport atexit\natexit.register(stop_batch_processor)'
        )
    
    with open(main_path, 'w') as f:
        f.write(main_content)
    print(f"✓ Updated {main_path}")
    
    # 6. Create upload directories
    print("[6/6] Creating upload directories...")
    os.makedirs(base_path / 'uploads', exist_ok=True)
    os.makedirs(base_path / 'uploads' / 'outputs', exist_ok=True)
    print(f"✓ Created upload directories")
    
    print("\n" + "="*60)
    print("  ✅ INTEGRATION COMPLETE!")
    print("="*60)
    print("\nNext step: Rebuild Docker")
    print("  docker-compose down")
    print("  docker-compose up -d --build")
    print("\nThen run tests:")
    print("  docker exec snowwhite-api python -m pytest -v")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()