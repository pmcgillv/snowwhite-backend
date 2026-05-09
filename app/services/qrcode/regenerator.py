"""QR Code Regenerator - Update PDFs with new QR codes"""
from typing import List, Dict, Optional
from io import BytesIO

class QRCodeRegenerator:
    """Regenerate PDFs with updated QR code data"""
    
    @staticmethod
    def regenerate_pdf_with_qr_codes(
        input_pdf_path: str,
        output_pdf_path: str,
        qr_codes: List[Dict],
        only_changed: bool = False
    ) -> Dict:
        """Regenerate PDF with updated QR codes"""
        try:
            from PyPDF2 import PdfReader, PdfWriter
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
            import qrcode
            from io import BytesIO
            
            reader = PdfReader(input_pdf_path)
            writer = PdfWriter()
            
            for page_num, page in enumerate(reader.pages):
                # Create overlay with new QR codes
                packet = BytesIO()
                can = canvas.Canvas(packet, pagesize=letter)
                
                y_position = 750
                updated_count = 0
                
                for qr in qr_codes:
                    # Skip unchanged if only_changed
                    if only_changed and not qr.get('changed', False):
                        continue
                    
                    # Generate QR code image
                    qr_obj = qrcode.QRCode(version=1, box_size=5, border=1)
                    qr_obj.add_data(qr['current_data'])
                    qr_obj.make(fit=True)
                    
                    qr_img = qr_obj.make_image()
                    
                    # Save to BytesIO
                    img_buffer = BytesIO()
                    qr_img.save(img_buffer, format='PNG')
                    img_buffer.seek(0)
                    
                    # Draw on canvas
                    can.drawString(50, y_position, f"QR: {qr['current_data']}")
                    y_position -= 30
                    updated_count += 1
                
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
                'message': 'PDF regenerated with updated QR codes',
                'qr_codes_updated': updated_count,
                'output_file': output_pdf_path
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
    
    @staticmethod
    def get_pdf_with_qr_codes(qr_codes: List[Dict], output_path: str) -> Dict:
        """Create new PDF with QR codes and data"""
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
            import qrcode
            from io import BytesIO
            
            c = canvas.Canvas(output_path, pagesize=letter)
            width, height = letter
            
            y = height - 50
            
            c.setFont("Helvetica-Bold", 14)
            c.drawString(50, y, "QR Codes with Data")
            y -= 30
            
            for qr in qr_codes:
                # Generate QR code
                qr_obj = qrcode.QRCode(version=1, box_size=8, border=2)
                qr_obj.add_data(qr['current_data'])
                qr_obj.make(fit=True)
                
                qr_img = qr_obj.make_image()
                
                # Save to temp file
                import tempfile
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                    qr_img.save(tmp.name)
                    qr_img_path = tmp.name
                
                # Draw on canvas
                c.drawImage(qr_img_path, 50, y - 100, width=100, height=100)
                c.drawString(160, y - 30, f"Data: {qr['current_data']}")
                
                if qr.get('changed'):
                    c.drawString(160, y - 50, f"Original: {qr['original_data']}")
                
                y -= 130
                
                if y < 50:
                    c.showPage()
                    y = height - 50
            
            c.save()
            
            return {
                'status': 'success',
                'message': 'PDF created with QR codes',
                'file_path': output_path
            }
        except Exception as e:
            return {'status': 'error', 'message': str(e)}
