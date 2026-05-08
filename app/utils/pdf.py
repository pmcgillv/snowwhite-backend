from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from io import BytesIO
from PIL import Image
from app.utils.barcode import generate_barcode, resize_barcode
from typing import List, Dict, Any
import tempfile
import os

def create_label_pdf(labels_data: List[Dict[str, Any]], barcode_type: str = "code128", page_size: str = "letter", labels_per_page: int = 4) -> BytesIO:
    page = A4 if page_size.lower() == "a4" else letter
    pdf_buffer = BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=page)
    
    page_width, page_height = page
    labels_per_row = 2
    labels_per_col = 2
    margin = 0.5 * inch
    label_width = (page_width - (2 * margin)) / labels_per_row
    label_height = (page_height - (2 * margin)) / labels_per_col
    
    for label_index, label_data in enumerate(labels_data):
        row = (label_index % labels_per_page) // labels_per_row
        col = (label_index % labels_per_page) % labels_per_row
        
        x = margin + (col * label_width)
        y = page_height - margin - ((row + 1) * label_height)
        
        c.setLineWidth(1)
        c.rect(x, y, label_width, label_height)
        
        text = label_data.get("text", "Label")
        code = label_data.get("code", "")
        description = label_data.get("description", "")
        
        c.setFont("Helvetica-Bold", 10)
        c.drawString(x + 10, y + label_height - 20, text)
        
        try:
            if code:
                barcode_img = generate_barcode(barcode_type, code)
                barcode_img = resize_barcode(barcode_img, width=150, height=60)
                
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                    tmp_path = tmp.name
                    barcode_img.save(tmp_path, format='PNG')
                
                c.drawImage(tmp_path, x + 10, y + 30, width=150, height=60)
                os.unlink(tmp_path)
        except Exception as e:
            c.setFont("Helvetica", 8)
            c.drawString(x + 10, y + 30, f"Error: {str(e)[:30]}")
        
        if description:
            c.setFont("Helvetica", 8)
            c.drawString(x + 10, y + 15, description[:50])
        
        c.setFont("Helvetica", 9)
        c.drawString(x + 10, y + 5, f"Code: {code}")
        
        if (label_index + 1) % labels_per_page == 0 and (label_index + 1) < len(labels_data):
            c.showPage()
    
    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer

def create_simple_label_pdf(text: str, code: str, barcode_type: str = "qr") -> BytesIO:
    pdf_buffer = BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)
    page_width, page_height = letter
    
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, page_height - 50, text)
    
    try:
        barcode_img = generate_barcode(barcode_type, code)
        barcode_img = resize_barcode(barcode_img, width=300, height=150)
        
        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
            tmp_path = tmp.name
            barcode_img.save(tmp_path, format='PNG')
        
        c.drawImage(tmp_path, 100, page_height - 300, width=300, height=150)
        os.unlink(tmp_path)
    except Exception as e:
        c.setFont("Helvetica", 12)
        c.drawString(50, page_height - 300, f"Barcode error: {str(e)}")
    
    c.setFont("Helvetica", 14)
    c.drawString(100, page_height - 330, f"Code: {code}")
    c.save()
    pdf_buffer.seek(0)
    return pdf_buffer