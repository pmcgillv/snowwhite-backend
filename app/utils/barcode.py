import barcode
from barcode.writer import ImageWriter
import qrcode
from io import BytesIO
from PIL import Image

def generate_code128(data: str) -> Image.Image:
    code = barcode.get('code128', data, writer=ImageWriter())
    buf = BytesIO()
    code.write(buf)
    buf.seek(0)
    return Image.open(buf)

def generate_ean13(data: str) -> Image.Image:
    code = barcode.get('ean13', data, writer=ImageWriter())
    buf = BytesIO()
    code.write(buf)
    buf.seek(0)
    return Image.open(buf)

def generate_upca(data: str) -> Image.Image:
    code = barcode.get('upca', data, writer=ImageWriter())
    buf = BytesIO()
    code.write(buf)
    buf.seek(0)
    return Image.open(buf)

def generate_qr(data: str, size: int = 10) -> Image.Image:
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=size,
        border=2,
    )
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white")

def generate_barcode(barcode_type: str, data: str) -> Image.Image:
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
    return image.resize((width, height), Image.Resampling.LANCZOS)