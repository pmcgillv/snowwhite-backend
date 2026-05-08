from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import csv
import io
from datetime import datetime

from app.database import get_db
from app.database_models import Job, Template, User
from app.dependencies import get_current_user, generate_id
from app.utils.barcode import generate_barcode, resize_barcode
from app.utils.pdf import create_label_pdf, create_simple_label_pdf

router = APIRouter()

@router.post("/generate-simple")
async def generate_simple_label(text: str, code: str, barcode_type: str = "qr", current_user: User = Depends(get_current_user)):
    try:
        pdf_buffer = create_simple_label_pdf(text, code, barcode_type)
        return StreamingResponse(iter([pdf_buffer.getvalue()]), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=label.pdf"})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF generation failed: {str(e)}")

@router.post("/generate-batch")
async def generate_batch_labels(template_id: str, barcode_type: str = "code128", labels_per_page: int = 4, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    template = db.query(Template).filter(Template.id == template_id, Template.organization_id == current_user.organization_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    try:
        labels_data = [
            {"text": "Product A", "code": f"SKU-{generate_id()[:8]}", "description": "Sample product"},
            {"text": "Product B", "code": f"SKU-{generate_id()[:8]}", "description": "Sample product"},
        ]
        pdf_buffer = create_label_pdf(labels_data, barcode_type=barcode_type, labels_per_page=labels_per_page)
        return StreamingResponse(iter([pdf_buffer.getvalue()]), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=labels_batch.pdf"})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch generation failed: {str(e)}")

@router.post("/upload-csv")
async def upload_csv_for_labels(file: UploadFile = File(...), barcode_type: str = "code128", current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        contents = await file.read()
        csv_reader = csv.DictReader(io.StringIO(contents.decode('utf-8')))
        
        labels_data = []
        for row in csv_reader:
            labels_data.append({"text": row.get("text", ""), "code": row.get("code", ""), "description": row.get("description", "")})
        
        if not labels_data:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        job_id = generate_id()
        job = Job(id=job_id, organization_id=current_user.organization_id, name=f"CSV Import - {file.filename}", status="completed", total_items=len(labels_data), processed_items=len(labels_data), completed_at=datetime.utcnow())
        db.add(job)
        db.commit()
        
        pdf_buffer = create_label_pdf(labels_data, barcode_type=barcode_type)
        return StreamingResponse(iter([pdf_buffer.getvalue()]), media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={file.filename.replace('.csv', '.pdf')}"})
    
    except csv.Error as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@router.get("/test-barcode/{barcode_type}/{code}")
async def test_barcode(barcode_type: str, code: str, current_user: User = Depends(get_current_user)):
    try:
        barcode_img = generate_barcode(barcode_type, code)
        img_buffer = io.BytesIO()
        barcode_img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        return StreamingResponse(iter([img_buffer.getvalue()]), media_type="image/png", headers={"Content-Disposition": f"attachment; filename=barcode_{barcode_type}_{code}.png"})
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Barcode generation failed: {str(e)}")

@router.get("/")
async def list_jobs(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.organization_id == current_user.organization_id).all()
    return {"jobs": [{"id": j.id, "name": j.name, "status": j.status, "created_at": j.created_at} for j in jobs]}

@router.get("/{job_id}")
async def get_job_status(job_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id, Job.organization_id == current_user.organization_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"id": job.id, "name": job.name, "status": job.status, "total_items": job.total_items, "processed_items": job.processed_items, "created_at": job.created_at, "completed_at": job.completed_at}