"""QR Code Editor Tests"""
import pytest

def test_qr_code_manager():
    """Test QR code manager"""
    from app.services.qrcode.manager import QRCodeManager
    
    manager = QRCodeManager()
    
    # Create QR code
    qr = manager.create_qr_code("https://example.com", {"x": 100, "y": 200}, "doc-1")
    assert qr.qr_id
    assert qr.current_data == "https://example.com"
    assert qr.original_data == "https://example.com"

def test_qr_code_update():
    """Test updating QR code"""
    from app.services.qrcode.manager import QRCodeManager
    
    manager = QRCodeManager()
    qr = manager.create_qr_code("https://old.com", {"x": 0, "y": 0}, "doc-1")
    
    result = manager.update_qr_code(qr.qr_id, "https://new.com")
    assert result['current_data'] == "https://new.com"
    assert result['original_data'] == "https://old.com"

def test_qr_code_restore():
    """Test restoring QR code"""
    from app.services.qrcode.manager import QRCodeManager
    
    manager = QRCodeManager()
    qr = manager.create_qr_code("original", {"x": 0, "y": 0}, "doc-1")
    
    manager.update_qr_code(qr.qr_id, "modified")
    result = manager.restore_qr_code(qr.qr_id)
    
    assert result['current_data'] == "original"

def test_qr_code_history():
    """Test QR code history tracking"""
    from app.services.qrcode.manager import QRCodeManager
    
    manager = QRCodeManager()
    qr = manager.create_qr_code("v1", {"x": 0, "y": 0}, "doc-1")
    
    manager.update_qr_code(qr.qr_id, "v2")
    manager.update_qr_code(qr.qr_id, "v3")
    
    history = manager.get_qr_code_history(qr.qr_id)
    assert len(history) == 3

def test_document_qr_codes():
    """Test getting all QR codes in document"""
    from app.services.qrcode.manager import QRCodeManager
    
    manager = QRCodeManager()
    manager.create_qr_code("qr1", {"x": 0, "y": 0}, "doc-1")
    manager.create_qr_code("qr2", {"x": 100, "y": 100}, "doc-1")
    manager.create_qr_code("qr3", {"x": 0, "y": 0}, "doc-2")
    
    doc1_qrs = manager.get_document_qr_codes("doc-1")
    assert len(doc1_qrs) == 2

def test_changed_qr_codes():
    """Test getting only changed QR codes"""
    from app.services.qrcode.manager import QRCodeManager
    
    manager = QRCodeManager()
    qr1 = manager.create_qr_code("unchanged", {"x": 0, "y": 0}, "doc-1")
    qr2 = manager.create_qr_code("will_change", {"x": 0, "y": 0}, "doc-1")
    
    manager.update_qr_code(qr2.qr_id, "changed")
    
    changed = manager.get_changed_qr_codes("doc-1")
    assert len(changed) == 1
    assert changed[0]['qr_id'] == qr2.qr_id
