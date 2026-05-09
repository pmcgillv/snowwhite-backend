"""Import Router"""
from typing import Dict, List

class ImportRouter:
    @staticmethod
    def upload_csv(file_path: str, template_id: str) -> Dict:
        from app.services.parsers.csv_parser import CSVParser
        with open(file_path, 'r') as f:
            content = f.read()
        headers, rows = CSVParser.parse(content)
        return {
            'import_job_id': 'job-' + str(len(rows)),
            'file_name': file_path.split('\\')[-1],
            'total_rows': len(rows),
            'columns': headers,
            'status': 'pending_mapping'
        }
    
    @staticmethod
    def create_mapping(template_id: str, mappings: List[Dict]) -> Dict:
        return {
            'template_id': template_id,
            'mappings_saved': len(mappings),
            'status': 'valid'
        }
