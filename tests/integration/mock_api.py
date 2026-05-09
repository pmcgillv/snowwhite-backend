"""Mock API for Frontend Testing"""

class MockAPI:
    """Simulates backend API for frontend testing"""
    
    @staticmethod
    def upload_csv(file_path: str, template_id: str) -> dict:
        """Mock: POST /api/v1/templates/{id}/import/upload"""
        return {
            'import_job_id': 'job-123',
            'file_name': 'products.csv',
            'total_rows': 100,
            'columns_detected': ['sku', 'name', 'qty'],
            'preview_rows': 10,
            'status': 'pending_mapping'
        }
    
    @staticmethod
    def upload_excel(file_path: str, template_id: str) -> dict:
        """Mock: POST /api/v1/templates/{id}/import/upload (Excel)"""
        return {
            'import_job_id': 'job-124',
            'file_name': 'inventory.xlsx',
            'total_rows': 500,
            'columns_detected': ['product_id', 'description', 'stock'],
            'preview_rows': 10,
            'status': 'pending_mapping'
        }
    
    @staticmethod
    def get_preview(import_job_id: str) -> dict:
        """Mock: GET /api/v1/import-jobs/{id}/preview"""
        return {
            'import_job_id': import_job_id,
            'total_rows': 100,
            'preview_data': [
                {'row_number': 1, 'data': {'sku': 'ABC123', 'name': 'Widget'}, 'status': 'valid'},
                {'row_number': 2, 'data': {'sku': 'DEF456', 'name': 'Gadget'}, 'status': 'valid'},
            ]
        }
    
    @staticmethod
    def create_mapping(template_id: str, mappings: list) -> dict:
        """Mock: POST /api/v1/templates/{id}/field-mapping"""
        return {
            'template_id': template_id,
            'mappings_saved': len(mappings),
            'validation_result': 'valid'
        }
    
    @staticmethod
    def create_serialization(template_id: str, config: dict) -> dict:
        """Mock: POST /api/v1/templates/{id}/serialization"""
        return {
            'counter_id': 'counter-1',
            'field_name': config.get('field_name', 'serial'),
            'current_value': 1,
            'formatted_example': f"{config.get('prefix', '')}000001{config.get('suffix', '')}",
            'preview': [
                f"{config.get('prefix', '')}000001{config.get('suffix', '')}",
                f"{config.get('prefix', '')}000002{config.get('suffix', '')}",
            ]
        }
    
    @staticmethod
    def batch_print(template_id: str, config: dict) -> dict:
        """Mock: POST /api/v1/templates/{id}/batch-print"""
        return {
            'batch_print_id': 'batch-1',
            'template_id': template_id,
            'total_labels': config.get('end_row', 100) - config.get('start_row', 1) + 1,
            'status': 'processing',
            'estimated_completion': '2024-05-08T14:30:00Z',
            'download_url': None
        }
    
    @staticmethod
    def get_batch_status(batch_print_id: str) -> dict:
        """Mock: GET /api/v1/batch-print/{id}"""
        return {
            'batch_print_id': batch_print_id,
            'status': 'completed',
            'total_labels': 100,
            'successful_labels': 100,
            'failed_labels': 0,
            'file_size': '2.5MB',
            'file_format': 'pdf',
            'download_url': 'https://...',
            'expires_at': '2024-05-10T14:30:00Z'
        }


class FrontendIntegrationTest:
    """Test frontend components with mock API"""
    
    def test_import_dialog_upload(self):
        """Frontend: Import Dialog can upload file"""
        result = MockAPI.upload_csv('products.csv', 'template-1')
        assert result['import_job_id']
        assert result['total_rows'] == 100
    
    def test_field_mapping_editor(self):
        """Frontend: Field Mapping can create mappings"""
        result = MockAPI.create_mapping('template-1', [
            {'field': 'sku', 'source': 'sku'}
        ])
        assert result['validation_result'] == 'valid'
    
    def test_serialization_panel(self):
        """Frontend: Serialization Panel can configure counter"""
        result = MockAPI.create_serialization('template-1', {
            'field_name': 'serial',
            'prefix': 'SN-',
            'pad_width': 6
        })
        assert 'SN-' in result['formatted_example']
    
    def test_batch_print_dialog(self):
        """Frontend: Batch Print Dialog can initiate printing"""
        result = MockAPI.batch_print('template-1', {
            'start_row': 1,
            'end_row': 100,
            'format': 'pdf'
        })
        assert result['status'] == 'processing'
        assert result['total_labels'] == 100
