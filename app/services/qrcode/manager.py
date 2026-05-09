"""QR Code Manager - Store and manage editable QR codes"""
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import uuid

class QRCode:
    """Represents an editable QR code"""
    
    def __init__(self, qr_id: str, data: str, position: Dict, document_id: str):
        self.qr_id = qr_id
        self.original_data = data
        self.current_data = data
        self.position = position  # x, y coordinates
        self.document_id = document_id
        self.created_at = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()
        self.history = [{'data': data, 'timestamp': self.created_at}]
    
    def update_data(self, new_data: str) -> Dict:
        """Update QR code data"""
        self.current_data = new_data
        self.updated_at = datetime.now().isoformat()
        self.history.append({
            'data': new_data,
            'timestamp': self.updated_at
        })
        return {
            'qr_id': self.qr_id,
            'original_data': self.original_data,
            'current_data': self.current_data,
            'updated_at': self.updated_at
        }
    
    def restore_original(self) -> Dict:
        """Restore to original data"""
        return self.update_data(self.original_data)
    
    def get_history(self) -> List[Dict]:
        """Get all changes"""
        return self.history
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            'qr_id': self.qr_id,
            'original_data': self.original_data,
            'current_data': self.current_data,
            'position': self.position,
            'document_id': self.document_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'changed': self.original_data != self.current_data,
            'history_count': len(self.history)
        }


class QRCodeManager:
    """Manage all QR codes in a document"""
    
    def __init__(self):
        self.qr_codes: Dict[str, QRCode] = {}
        self.documents: Dict[str, List[str]] = {}  # doc_id -> [qr_ids]
    
    def create_qr_code(self, data: str, position: Dict, document_id: str) -> QRCode:
        """Create new QR code"""
        qr_id = str(uuid.uuid4())[:8]
        qr_code = QRCode(qr_id, data, position, document_id)
        
        self.qr_codes[qr_id] = qr_code
        
        if document_id not in self.documents:
            self.documents[document_id] = []
        self.documents[document_id].append(qr_id)
        
        return qr_code
    
    def get_qr_code(self, qr_id: str) -> Optional[QRCode]:
        """Get QR code by ID"""
        return self.qr_codes.get(qr_id)
    
    def update_qr_code(self, qr_id: str, new_data: str) -> Dict:
        """Update QR code data"""
        qr_code = self.get_qr_code(qr_id)
        if not qr_code:
            return {'error': 'QR code not found'}
        
        return qr_code.update_data(new_data)
    
    def get_document_qr_codes(self, document_id: str) -> List[Dict]:
        """Get all QR codes in document"""
        qr_ids = self.documents.get(document_id, [])
        return [self.qr_codes[qr_id].to_dict() for qr_id in qr_ids]
    
    def get_changed_qr_codes(self, document_id: str) -> List[Dict]:
        """Get only QR codes that have been changed"""
        all_codes = self.get_document_qr_codes(document_id)
        return [qr for qr in all_codes if qr['changed']]
    
    def restore_qr_code(self, qr_id: str) -> Dict:
        """Restore QR code to original"""
        qr_code = self.get_qr_code(qr_id)
        if not qr_code:
            return {'error': 'QR code not found'}
        
        return qr_code.restore_original()
    
    def get_qr_code_history(self, qr_id: str) -> List[Dict]:
        """Get QR code change history"""
        qr_code = self.get_qr_code(qr_id)
        if not qr_code:
            return []
        
        return qr_code.get_history()
    
    def delete_qr_code(self, qr_id: str) -> bool:
        """Delete QR code"""
        if qr_id in self.qr_codes:
            qr_code = self.qr_codes[qr_id]
            del self.qr_codes[qr_id]
            
            doc_id = qr_code.document_id
            if doc_id in self.documents:
                self.documents[doc_id].remove(qr_id)
            
            return True
        return False
    
    def export_document_state(self, document_id: str) -> Dict:
        """Export all QR code data for document"""
        return {
            'document_id': document_id,
            'qr_codes': self.get_document_qr_codes(document_id),
            'total_qr_codes': len(self.documents.get(document_id, [])),
            'changed_qr_codes': len(self.get_changed_qr_codes(document_id))
        }
