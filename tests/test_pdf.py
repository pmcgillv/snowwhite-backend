import pytest
from app.utils.pdf import create_label_pdf, create_simple_label_pdf
from io import BytesIO

@pytest.mark.pdf
def test_create_simple_label_pdf():
    pdf = create_simple_label_pdf("Test Product", "SKU123", "qr")
    assert pdf is not None
    assert isinstance(pdf, BytesIO)
    assert pdf.getbuffer().nbytes > 0

@pytest.mark.pdf
def test_create_simple_label_pdf_code128():
    pdf = create_simple_label_pdf("Product", "CODE123", "code128")
    assert pdf is not None
    assert isinstance(pdf, BytesIO)
    assert pdf.getbuffer().nbytes > 0

@pytest.mark.pdf
def test_create_label_pdf_single():
    labels = [
        {"text": "Product A", "code": "SKU001", "description": "First"}
    ]
    pdf = create_label_pdf(labels, barcode_type="qr")
    assert pdf is not None
    assert isinstance(pdf, BytesIO)
    assert pdf.getbuffer().nbytes > 0

@pytest.mark.pdf
def test_create_label_pdf_multiple():
    labels = [
        {"text": "Product A", "code": "SKU001", "description": "First"},
        {"text": "Product B", "code": "SKU002", "description": "Second"},
        {"text": "Product C", "code": "SKU003", "description": "Third"},
    ]
    pdf = create_label_pdf(labels, barcode_type="code128")
    assert pdf is not None
    assert isinstance(pdf, BytesIO)
    assert pdf.getbuffer().nbytes > 0

@pytest.mark.pdf
def test_create_label_pdf_a4():
    labels = [{"text": "Test", "code": "T001", "description": "Test"}]
    pdf = create_label_pdf(labels, page_size="a4")
    assert pdf is not None
    assert isinstance(pdf, BytesIO)

@pytest.mark.pdf
def test_create_label_pdf_empty_description():
    labels = [{"text": "Product", "code": "SKU", "description": ""}]
    pdf = create_label_pdf(labels)
    assert pdf is not None
    assert isinstance(pdf, BytesIO)

@pytest.mark.pdf
def test_create_label_pdf_missing_code():
    labels = [{"text": "Product", "code": "", "description": "Test"}]
    pdf = create_label_pdf(labels)
    assert pdf is not None
    assert isinstance(pdf, BytesIO)

@pytest.mark.pdf
def test_pdf_size_reasonable():
    labels = [{"text": "P", "code": "C", "description": "D"}]
    pdf = create_label_pdf(labels)
    size = pdf.getbuffer().nbytes
    assert size > 1000
    assert size < 100000