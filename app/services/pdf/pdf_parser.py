"""PDF Parser - Extract data from PDF files"""
from typing import List, Dict, Tuple, Optional
import io

class PDFParser:
    """Parse PDF files and extract structured data"""
    
    @staticmethod
    def extract_text(file_path: str) -> Dict:
        """Extract all text from PDF"""
        try:
            from PyPDF2 import PdfReader
            
            reader = PdfReader(file_path)
            data = {
                'total_pages': len(reader.pages),
                'pages': []
            }
            
            for page_num, page in enumerate(reader.pages, 1):
                text = page.extract_text()
                data['pages'].append({
                    'page_number': page_num,
                    'text': text,
                    'lines': text.split('\n') if text else []
                })
            
            return data
        except Exception as e:
            return {'error': str(e), 'total_pages': 0, 'pages': []}
    
    @staticmethod
    def extract_tables(file_path: str) -> List[Dict]:
        """Extract table data from PDF"""
        try:
            import pdfplumber
            
            tables = []
            with pdfplumber.open(file_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    page_tables = page.extract_tables()
                    if page_tables:
                        for table in page_tables:
                            tables.append({
                                'page': page_num,
                                'data': table
                            })
            
            return tables
        except Exception as e:
            return []
    
    @staticmethod
    def extract_metadata(file_path: str) -> Dict:
        """Extract PDF metadata"""
        try:
            from PyPDF2 import PdfReader
            
            reader = PdfReader(file_path)
            metadata = reader.metadata
            
            return {
                'title': metadata.get('/Title', 'N/A'),
                'author': metadata.get('/Author', 'N/A'),
                'subject': metadata.get('/Subject', 'N/A'),
                'creator': metadata.get('/Creator', 'N/A'),
                'pages': len(reader.pages),
                'file_size': os.path.getsize(file_path) / 1024  # KB
            }
        except Exception as e:
            return {'error': str(e)}
    
    @staticmethod
    def get_columns_from_data(text_lines: List[str]) -> List[str]:
        """Detect columns from PDF text"""
        if not text_lines:
            return []
        
        # Assume first line is header
        headers = text_lines[0].split()
        return headers
    
    @staticmethod
    def parse_rows(text_lines: List[str]) -> List[Dict]:
        """Parse PDF rows into structured data"""
        rows = []
        
        if len(text_lines) < 2:
            return rows
        
        headers = text_lines[0].split()
        
        for line in text_lines[1:]:
            if line.strip():
                values = line.split()
                if len(values) == len(headers):
                    row = dict(zip(headers, values))
                    rows.append(row)
        
        return rows


import os
