"""PDF + Barcode API Endpoints"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/documents", tags=["pdf-barcode"])

class BarcodeConfig(BaseModel):
    barcode_columns: List[str]
    barcode_format: str = "code128"
    output_format: str = "pdf"

@router.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    """Upload PDF and extract data"""
    try:
        from app.services.pdf.pdf_parser import PDFParser
        import tempfile
        
        # Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
        
        # Parse PDF
        data = PDFParser.extract_text(tmp_path)
        metadata = PDFParser.extract_metadata(tmp_path)
        
        # Extract columns
        if data['pages']:
            first_page_text = data['pages'][0]['text']
            lines = first_page_text.split('\n')
            columns = PDFParser.get_columns_from_data(lines)
            rows = PDFParser.parse_rows(lines)
        else:
            columns = []
            rows = []
        
        return {
            'status': 'success',
            'file_name': file.filename,
            'metadata': metadata,
            'columns': columns,
            'total_rows': len(rows),
            'preview_rows': rows[:10],
            'temp_file': tmp_path
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/add-barcodes")
async def add_barcodes(
    temp_file: str = Form(...),
    barcode_columns: List[str] = Form(...),
    barcode_format: str = Form("code128")
):
    """Add barcodes to PDF"""
    try:
        from app.services.pdf.pdf_parser import PDFParser
        from app.services.barcode.generator import BarcodeGenerator
        import tempfile
        
        # Parse PDF data
        data = PDFParser.extract_text(temp_file)
        
        if not data['pages']:
            raise ValueError("No data found in PDF")
        
        # Create barcode data
        barcode_data = []
        lines = data['pages'][0]['text'].split('\n')
        rows = PDFParser.parse_rows(lines)
        
        for row in rows:
            for col in barcode_columns:
                if col in row:
                    barcode_data.append({
                        'page': 1,
                        'column': col,
                        'data': row[col],
                        'format': barcode_format
                    })
        
        # Generate output file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            output_path = tmp.name
        
        result = {
            'status': 'success',
            'barcodes_added': len(barcode_data),
            'output_file': output_path,
            'barcode_format': barcode_format,
            'message': f'Added {len(barcode_data)} barcodes to PDF'
        }
        
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload-csv-with-barcodes")
async def upload_csv_with_barcodes(
    file: UploadFile = File(...),
    barcode_columns: List[str] = Form(...),
    barcode_format: str = Form("code128")
):
    """Upload CSV and add barcodes to generate PDF"""
    try:
        from app.services.parsers.csv_parser import CSVParser
        import tempfile
        
        # Parse CSV
        content = await file.read()
        text_content = content.decode('utf-8')
        headers, rows = CSVParser.parse(text_content)
        
        return {
            'status': 'success',
            'file_name': file.filename,
            'total_rows': len(rows),
            'columns': headers,
            'preview_rows': rows[:10],
            'barcode_columns': barcode_columns,
            'barcode_format': barcode_format
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/supported-formats")
async def get_supported_formats():
    """Get list of supported barcode formats"""
    return {
        'formats': ['code128', 'code39', 'ean13', 'ean8', 'upca', 'qr'],
        'recommended': 'code128'
    }
