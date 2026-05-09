"""QR Code Editor API Endpoints"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.qrcode.manager import QRCodeManager

router = APIRouter(prefix="/api/v1/qrcodes", tags=["qrcode"])

# Global manager
qr_manager = QRCodeManager()

class QRCodeData(BaseModel):
    data: str
    position: Dict

class QRCodeUpdate(BaseModel):
    new_data: str

@router.post("/documents/{document_id}/create")
async def create_qr_code(document_id: str, qr_data: QRCodeData):
    """Create new QR code"""
    qr = qr_manager.create_qr_code(qr_data.data, qr_data.position, document_id)
    return qr.to_dict()

@router.get("/documents/{document_id}")
async def get_document_qr_codes(document_id: str):
    """Get all QR codes in document"""
    qr_codes = qr_manager.get_document_qr_codes(document_id)
    return {
        'document_id': document_id,
        'qr_codes': qr_codes,
        'total': len(qr_codes),
        'changed': len([q for q in qr_codes if q['changed']])
    }

@router.get("/qrcodes/{qr_id}")
async def get_qr_code(qr_id: str):
    """Get QR code details"""
    qr = qr_manager.get_qr_code(qr_id)
    if not qr:
        raise HTTPException(status_code=404, detail="QR code not found")
    return qr.to_dict()

@router.put("/qrcodes/{qr_id}")
async def update_qr_code(qr_id: str, update: QRCodeUpdate):
    """Update QR code data"""
    result = qr_manager.update_qr_code(qr_id, update.new_data)
    if 'error' in result:
        raise HTTPException(status_code=404, detail=result['error'])
    return result

@router.post("/qrcodes/{qr_id}/restore")
async def restore_qr_code(qr_id: str):
    """Restore QR code to original"""
    result = qr_manager.restore_qr_code(qr_id)
    if 'error' in result:
        raise HTTPException(status_code=404, detail=result['error'])
    return {
        'status': 'success',
        'message': 'QR code restored to original',
        'qr_code': result
    }

@router.get("/qrcodes/{qr_id}/history")
async def get_qr_history(qr_id: str):
    """Get QR code change history"""
    history = qr_manager.get_qr_code_history(qr_id)
    if not history:
        raise HTTPException(status_code=404, detail="QR code not found")
    return {
        'qr_id': qr_id,
        'history': history,
        'total_changes': len(history) - 1
    }

@router.delete("/qrcodes/{qr_id}")
async def delete_qr_code(qr_id: str):
    """Delete QR code"""
    if qr_manager.delete_qr_code(qr_id):
        return {'status': 'success', 'message': 'QR code deleted'}
    raise HTTPException(status_code=404, detail="QR code not found")

@router.get("/documents/{document_id}/export")
async def export_document_state(document_id: str):
    """Export all QR code data for document"""
    return qr_manager.export_document_state(document_id)

@router.post("/documents/{document_id}/regenerate-pdf")
async def regenerate_pdf_with_qr_codes(document_id: str, pdf_path: str):
    """Regenerate PDF with updated QR codes"""
    from app.services.qrcode.regenerator import QRCodeRegenerator
    
    qr_codes = qr_manager.get_document_qr_codes(document_id)
    
    output_path = pdf_path.replace('.pdf', '_with_qrcodes.pdf')
    result = QRCodeRegenerator.regenerate_pdf_with_qr_codes(
        pdf_path,
        output_path,
        qr_codes,
        only_changed=True
    )
    
    return result
