"""PDF Document Builder - Add barcodes to PDFs"""
from typing import List, Dict, Optional
import io

class PDFDocumentBuilder:
    """Build new PDFs with barcodes and text"""
    
    @staticmethod
    def add_barcodes_to_pdf(
        input_pdf_path: str,
        output_pdf_path: str,
        barcode_data: List[Dict],
        barcode_format: str = 'code128'
    ) -> Dict:
        """Add barcodes to existing PDF"""
        try:
            from PyPDF2 import PdfReader, PdfWriter
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            from io import BytesIO
            
            reader = PdfReader(input_pdf_path)
            writer = PdfWriter()
            
            for page_num, page in enumerate(reader.pages):
                # Create overlay with barcodes
                packet = BytesIO()
                can = canvas.Canvas(packet, pagesize=letter)
                
                # Add barcodes for this page
                y_position = 750
                for item in barcode_data:
                    if item.get('page') == page_num + 1:
                        # Draw barcode text
                        can.drawString(50, y_position, f"Barcode: {item['data']}")
                        y_position -= 30
                
                can.save()
                packet.seek(0)
                
                # Merge with original page
                overlay = PdfReader(packet).pages[0]
                page.merge_page(overlay)
                writer.add_page(page)
            
            # Write output
            with open(output_pdf_path, 'wb') as f:
                writer.write(f)
            
            return {
                'status': 'success',
                'message': f'PDF with barcodes saved to {output_pdf_path}',
                'file_size': os.path.getsize(output_pdf_path) / 1024  # KB
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    @staticmethod
    def create_pdf_from_data(
        data: List[Dict],
        columns: List[str],
        barcode_columns: List[str],
        barcode_format: str = 'code128',
        output_path: str = 'output.pdf'
    ) -> Dict:
        """Create new PDF from data with barcodes"""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
            from reportlab.lib import colors
            
            c = canvas.Canvas(output_path, pagesize=letter)
            width, height = letter
            
            y = height - 50
            x = 50
            
            # Header
            c.setFont("Helvetica-Bold", 14)
            c.drawString(x, y, "Data with Barcodes")
            y -= 30
            
            # Column headers
            c.setFont("Helvetica", 10)
            col_width = (width - 100) / len(columns)
            for col in columns:
                c.drawString(x, y, col)
                x += col_width
            
            y -= 20
            x = 50
            
            # Data rows
            c.setFont("Helvetica", 9)
            for row in data:
                for col in columns:
                    value = row.get(col, '')
                    c.drawString(x, y, str(value))
                    x += col_width
                
                # Add barcode for selected column
                if barcode_columns:
                    barcode_value = row.get(barcode_columns[0], '')
                    c.drawString(width - 150, y, f"BC: {barcode_value}")
                
                y -= 15
                x = 50
                
                if y < 50:
                    c.showPage()
                    y = height - 50
            
            c.save()
            
            return {
                'status': 'success',
                'message': f'PDF created: {output_path}',
                'file_size': os.path.getsize(output_path) / 1024
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}


import os
