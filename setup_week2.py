#!/usr/bin/env python3
"""
SnowWhite Week 2 Setup Script
Automatically creates all barcode/PDF generation files
"""

import os
import sys

# Define the base path
BASE_PATH = os.path.dirname(os.path.abspath(__file__))

def create_file(path, content):
    """Create a file with the given content"""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"✅ Created: {path}")

def update_requirements():
    """Update requirements.txt with Week 2 dependencies"""
    requirements_content = """fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-dotenv==1.0.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.1.1
cryptography==41.0.7
python-multipart==0.0.6
email-validator==2.1.0
requests==2.31.0
httpx==0.25.2
python-barcode==0.15.1
qrcode==7.4.2
pillow==10.1.0
reportlab==4.0.7
openpyxl==3.11.0
python-csv==0.0.13
"""
    
    req_path = os.path.join(BASE_PATH, 'requirements.txt')
    with open(req_path, 'w') as f:
        f.write(requirements_content)
    print(f"✅ Updated: {req_path}")

def create_utils_init():
    """Create app/utils/__init__.py"""
    content = '''"""Utility modules for SnowWhite"""
'''
    path = os.path.join(BASE_PATH, 'app', 'utils', '__init__.py')
    create_file(path, content)

def create_barcode_utils():
    """Create app/utils/barcode.py"""
    content = '''import barcode
from barcode.writer import ImageWriter
import qrcode
from io import BytesIO
from PIL import Image
import os

def generate_code128(data: str) -> Image.Image:
    """Generate Code128 barcode"""
    try:
        code = barcode.get('code128', data, writer=ImageWriter())
        buf = BytesIO()
        code.write(buf)
        buf.seek(0)
        return Image.open(buf)
    except Exception as e:
        raise Exception(f"Code128 generation failed: {str(e)}")

def generate_ean13(data: str) -> Image.Image:
    """Generate EAN13 barcode"""
    try:
        code = barcode.get('ean13', data, writer=ImageWriter())
        buf = BytesIO()
        code.write(buf)
        buf.seek(0)
        return Image.open(buf)
    except Exception as e:
        raise Exception(f"EAN13 generation failed: {str(e)}")

def generate_upca(data: str) -> Image.Image:
    """Generate UPC-A barcode"""
    try:
        code = barcode.get('upca', data, writer=ImageWriter())
        buf = BytesIO()
        code.write(buf)
        buf.seek(0)
        return Image.open(buf)
    except Exception as e:
        raise Exception(f"UPC-A generation failed: {str(e)}")

def generate_qr(data: str, size: int = 10) -> Image.Image:
    """Generate QR code"""
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=size,
            border=2,
        )
        qr.add_data(data)
        qr.make(fit=True)
        return qr.make_image(fill_color="black", back_color="white")
    except Exception as e:
        raise Exception(f"QR code generation failed: {str(e)}")

def generate_barcode(barcode_type: str, data: str) -> Image.Image:
    """
    Generate barcode based on type
    
    Types: code128, ean13, upca, qr
    """
    barcode_type = barcode_type.lower()
    
    if barcode_type == "code128":
        return generate_code128(data)
    elif barcode_type == "ean13":
        return generate_ean13(data)
    elif barcode_type == "upca":
        return generate_upca(data)
    elif barcode_type == "qr":
        return generate_qr(data)
    else:
        raise ValueError(f"Unsupported barcode type: {barcode_type}")

def resize_barcode(image: Image.Image, width: int = 200, height: int = 100) -> Image.Image:
    """Resize barcode image to specified dimensions"""
    return image.resize((width, height), Image.Resampling.LANCZOS)
'''
    path = os.path.join(BASE_PATH, 'app', 'utils', 'barcode.py')
    create_file(path, content)

def create_pdf_utils():
    """Create app/utils/pdf.py"""
    content = '''from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import mm, inch
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from io import BytesIO
from PIL import Image
from app.utils.barcode import generate_barcode, resize_barcode
from typing import List, Dict, Any

def create_label_pdf(
    labels_data: List[Dict[str, Any]],
    barcode_type: str = "code128",
    page_size: str = "letter",
    labels_per_page: int = 4
) -> BytesIO:
    """
    Create a PDF with multiple labels and barcodes
    
    labels_data: List of dicts with keys like:
        - text: "Product Name"
        - code: "12345678"
        - description: "Optional description"
    """
    
    # Determine page size
    if page_size.lower() == "a4":
        page = A4
    else:
        page = letter
    
    # Create PDF
    pdf_buffer = BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=page)
    
    page_width, page_height = page
    labels_per_row = 2
    labels_per_col = 2
    
    # Calculate label dimensions
    margin = 0.5 * inch
    label_width = (page_width - (2 * margin)) / labels_per_row
    label_height = (page_height - (2 * margin)) / labels_per_col
    
    label_index = 0
    page_number = 1
    
    for label_data in labels_data:
        # Calculate position on page
        row = (label_index % labels_per_page) // labels_per_row
        col = (label_index % labels_per_page) % labels_per_row
        
        x = margin + (col * label_width)
        y = page_height - margin - ((row + 1) * label_height)
        
        # Draw label background
        c.setLineWidth(1)
        c.rect(x, y, label_width, label_height)
        
        # Add text
        text = label_data.get("text", "Label")
        code = label_data.get("code", "")
        description = label_data.get("description", "")
        
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 10, y + label_height - 20, text)
        
        # Generate and add barcode
        try:
            if code:
                barcode_img = generate_barcode(barcode_type, code)
                barcode_img = resize_barcode(barcode_img, width=150, height=60)
                
                # Convert PIL image to temporary file-like object
                img_buffer = BytesIO()
                barcode_img.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                # Draw barcode
                c.drawImage(img_buffer, x + 10, y + 30, width=150, height=60)
        except Exception as e:
            c.setFont("Helvetica", 8)
            c.drawString(x + 10, y + 30, f"Error: {str(e)[:30]}")
        
        # Add description
        if description:
            c.setFont("Helvetica", 8)
            c.drawString(x + 10, y + 15, description[:50])
        
        # Add code text
        c.setFont("Helvetica", 9)
        c.drawString(x + 10, y + 5, f"Code: {code}")
        
        label_index += 1
        
        # New page if needed
        if label_index % labels_per_page == 0 and label_index < len(labels_data):
            c.showPage()
            page_number += 1
    
    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer

def create_simple_label_pdf(
    text: str,
    code: str,
    barcode_type: str = "qr"
) -> BytesIO:
    """Create a simple single-label PDF"""
    pdf_buffer = BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)
    
    page_width, page_height = letter
    
    # Title
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, page_height - 50, text)
    
    # Generate barcode
    try:
        barcode_img = generate_barcode(barcode_type, code)
        barcode_img = resize_barcode(barcode_img, width=300, height=150)
        
        img_buffer = BytesIO()
        barcode_img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        c.drawImage(img_buffer, 100, page_height - 300, width=300, height=150)
    except Exception as e:
        c.setFont("Helvetica", 12)
        c.drawString(50, page_height - 300, f"Barcode error: {str(e)}")
    
    # Code text
    c.setFont("Helvetica", 14)
    c.drawString(100, page_height - 330, f"Code: {code}")
    
    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer
'''
    path = os.path.join(BASE_PATH, 'app', 'utils', 'pdf.py')
    create_file(path, content)

def create_labels_endpoint():
    """Create/update app/api/v1/labels.py"""
    content = '''from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
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
async def generate_simple_label(
    text: str,
    code: str,
    barcode_type: str = "qr",
    current_user: User = Depends(get_current_user)
):
    """Generate a single label with barcode and return as PDF"""
    try:
        pdf_buffer = create_simple_label_pdf(text, code, barcode_type)
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=label.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF generation failed: {str(e)}")

@router.post("/generate-batch")
async def generate_batch_labels(
    template_id: str,
    barcode_type: str = "code128",
    labels_per_page: int = 4,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate batch labels from template and return PDF"""
    # Verify template exists
    template = db.query(Template).filter(
        Template.id == template_id,
        Template.organization_id == current_user.organization_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    try:
        # Sample data (in production, this would come from CSV upload)
        labels_data = [
            {
                "text": "Product A",
                "code": f"SKU-{generate_id()[:8]}",
                "description": "Sample product"
            },
            {
                "text": "Product B",
                "code": f"SKU-{generate_id()[:8]}",
                "description": "Sample product"
            },
        ]
        
        pdf_buffer = create_label_pdf(
            labels_data,
            barcode_type=barcode_type,
            labels_per_page=labels_per_page
        )
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment; filename=labels_batch.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Batch generation failed: {str(e)}")

@router.post("/upload-csv")
async def upload_csv_for_labels(
    file: UploadFile = File(...),
    barcode_type: str = "code128",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload CSV file and generate labels PDF"""
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    
    try:
        # Read CSV file
        contents = await file.read()
        csv_reader = csv.DictReader(io.StringIO(contents.decode('utf-8')))
        
        labels_data = []
        for row in csv_reader:
            labels_data.append({
                "text": row.get("text", ""),
                "code": row.get("code", ""),
                "description": row.get("description", "")
            })
        
        if not labels_data:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Create job record
        job_id = generate_id()
        job = Job(
            id=job_id,
            organization_id=current_user.organization_id,
            name=f"CSV Import - {file.filename}",
            status="completed",
            total_items=len(labels_data),
            processed_items=len(labels_data),
            completed_at=datetime.utcnow()
        )
        db.add(job)
        db.commit()
        
        # Generate PDF
        pdf_buffer = create_label_pdf(
            labels_data,
            barcode_type=barcode_type
        )
        
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={file.filename.replace('.csv', '.pdf')}"}
        )
    
    except csv.Error as e:
        raise HTTPException(status_code=400, detail=f"CSV parsing error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@router.get("/test-barcode/{barcode_type}/{code}")
async def test_barcode(
    barcode_type: str,
    code: str,
    current_user: User = Depends(get_current_user)
):
    """Test barcode generation and return as PNG image"""
    try:
        barcode_img = generate_barcode(barcode_type, code)
        
        img_buffer = io.BytesIO()
        barcode_img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return StreamingResponse(
            iter([img_buffer.getvalue()]),
            media_type="image/png",
            headers={"Content-Disposition": f"attachment; filename=barcode_{barcode_type}_{code}.png"}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Barcode generation failed: {str(e)}")

@router.get("/")
async def list_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all label generation jobs"""
    jobs = db.query(Job).filter(
        Job.organization_id == current_user.organization_id
    ).all()
    return {"jobs": [{"id": j.id, "name": j.name, "status": j.status, "created_at": j.created_at} for j in jobs]}

@router.get("/{job_id}")
async def get_job_status(
    job_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get status of a label generation job"""
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.organization_id == current_user.organization_id
    ).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return {
        "id": job.id,
        "name": job.name,
        "status": job.status,
        "total_items": job.total_items,
        "processed_items": job.processed_items,
        "created_at": job.created_at,
        "completed_at": job.completed_at
    }
'''
    path = os.path.join(BASE_PATH, 'app', 'api', 'v1', 'labels.py')
    create_file(path, content)

def main():
    """Run the setup"""
    print()
    print("=" * 50)
    print("  SnowWhite Week 2 Setup")
    print("=" * 50)
    print()
    
    try:
        print("Creating utils package...")
        create_utils_init()
        create_barcode_utils()
        create_pdf_utils()
        
        print("\nUpdating labels endpoint...")
        create_labels_endpoint()
        
        print("\nUpdating requirements.txt...")
        update_requirements()
        
        print()
        print("=" * 50)
        print("  ✅ SETUP COMPLETE!")
        print("=" * 50)
        print()
        print("Next steps:")
        print("1. In PowerShell, run: docker-compose down")
        print("2. Then run: docker-compose up -d --build")
        print("3. Wait 60-90 seconds for dependencies to install")
        print("4. Go to: http://localhost:8000/docs")
        print("5. Test the new endpoints!")
        print()
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()