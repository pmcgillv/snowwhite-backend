"""Batch label processing API endpoints"""
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
