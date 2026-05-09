"""Barcode Generator - Multiple formats"""
from typing import Optional, Dict, Tuple
from io import BytesIO
import base64

class BarcodeGenerator:
    """Generate barcodes in multiple formats"""
    
    SUPPORTED_FORMATS = [
        'code128', 'code39', 'ean13', 'ean8', 'upca', 'qr'
    ]
    
    @staticmethod
    def generate_code128(data: str, width: int = 200, height: int = 50) -> bytes:
        """Generate Code128 barcode"""
        try:
            import barcode
            from barcode.writer import ImageWriter
            
            bar = barcode.Code128(data, writer=ImageWriter())
            img_buffer = BytesIO()
            bar.write(img_buffer, options={'module_width': 0.5, 'module_height': 10})
            img_buffer.seek(0)
            return img_buffer.getvalue()
        except Exception as e:
            return b''
    
    @staticmethod
    def generate_qr(data: str, size: int = 10) -> bytes:
        """Generate QR code"""
        try:
            import qrcode
            
            qr = qrcode.QRCode(version=1, box_size=size, border=2)
            qr.add_data(data)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            img_buffer = BytesIO()
            img.save(img_buffer, format='PNG')
            img_buffer.seek(0)
            return img_buffer.getvalue()
        except Exception as e:
            return b''
    
    @staticmethod
    def generate_ean13(data: str) -> bytes:
        """Generate EAN-13 barcode"""
        try:
            import barcode
            from barcode.writer import ImageWriter
            
            # Pad with zeros to 13 digits
            data = str(data).zfill(13)[:13]
            bar = barcode.EAN13(data, writer=ImageWriter())
            img_buffer = BytesIO()
            bar.write(img_buffer, options={'module_width': 0.5, 'module_height': 10})
            img_buffer.seek(0)
            return img_buffer.getvalue()
        except Exception as e:
            return b''
    
    @staticmethod
    def generate_upca(data: str) -> bytes:
        """Generate UPC-A barcode"""
        try:
            import barcode
            from barcode.writer import ImageWriter
            
            data = str(data).zfill(12)[:12]
            bar = barcode.UPCA(data, writer=ImageWriter())
            img_buffer = BytesIO()
            bar.write(img_buffer, options={'module_width': 0.5, 'module_height': 10})
            img_buffer.seek(0)
            return img_buffer.getvalue()
        except Exception as e:
            return b''
    
    @staticmethod
    def generate(data: str, format: str = 'code128') -> Dict:
        """Generate barcode in specified format"""
        if format not in BarcodeGenerator.SUPPORTED_FORMATS:
            return {'error': f'Unsupported format: {format}'}
        
        generators = {
            'code128': BarcodeGenerator.generate_code128,
            'qr': BarcodeGenerator.generate_qr,
            'ean13': BarcodeGenerator.generate_ean13,
            'upca': BarcodeGenerator.generate_upca,
        }
        
        generator = generators.get(format)
        if not generator:
            return {'error': 'Generator not found'}
        
        barcode_bytes = generator(data)
        
        if barcode_bytes:
            b64 = base64.b64encode(barcode_bytes).decode('utf-8')
            return {
                'status': 'success',
                'format': format,
                'data': data,
                'barcode_base64': b64,
                'barcode_type': f'data:image/png;base64,{b64}'
            }
        else:
            return {'error': 'Failed to generate barcode'}


from io import BytesIO
import base64
