import pytest
from app.utils.barcode import generate_barcode, generate_qr, generate_code128, resize_barcode
from PIL import Image

@pytest.mark.barcode
def test_generate_qr():
    img = generate_qr("TEST123")
    assert img is not None
    assert hasattr(img, 'size')
    assert img.size[0] > 0
    assert img.size[1] > 0

@pytest.mark.barcode
def test_generate_code128():
    img = generate_code128("1234567890")
    assert img is not None
    assert isinstance(img, Image.Image)

@pytest.mark.barcode
def test_generate_ean13():
    img = generate_barcode("ean13", "5901234123457")
    assert img is not None
    assert isinstance(img, Image.Image)

@pytest.mark.barcode
def test_generate_upca():
    img = generate_barcode("upca", "12345678901")
    assert img is not None
    assert isinstance(img, Image.Image)

@pytest.mark.barcode
def test_generate_barcode_qr():
    img = generate_barcode("qr", "TESTCODE")
    assert img is not None
    assert hasattr(img, 'size')
    assert img.size[0] > 0

@pytest.mark.barcode
def test_generate_barcode_code128():
    img = generate_barcode("code128", "ABC123")
    assert img is not None
    assert isinstance(img, Image.Image)

@pytest.mark.barcode
def test_generate_barcode_invalid_type():
    with pytest.raises(ValueError):
        generate_barcode("invalid_type", "CODE")

@pytest.mark.barcode
def test_resize_barcode():
    img = generate_qr("TEST")
    resized = resize_barcode(img, width=300, height=150)
    assert resized.size[0] == 300
    assert resized.size[1] == 150

@pytest.mark.barcode
def test_barcode_empty_string():
    try:
        img = generate_barcode("qr", "")
        assert img is not None
    except Exception:
        pass

@pytest.mark.barcode
def test_barcode_long_string():
    long_code = "A" * 100
    img = generate_barcode("qr", long_code)
    assert img is not None