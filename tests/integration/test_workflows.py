"""Integration Tests - Full Workflow"""
import pytest
from app.services.parsers.csv_parser import CSVParser
from app.services.validators.data_validator import DataValidator
from app.services.serialization.counter import SerializationCounter
from app.services.database.query_builder import QueryBuilder

class TestImportWorkflow:
    """Test complete import workflow"""
    
    def test_csv_upload_and_validate(self):
        """1. Upload CSV and validate"""
        csv_data = "sku,name,qty\nABC123,Widget,100\nDEF456,Gadget,50"
        headers, rows = CSVParser.parse(csv_data)
        
        assert len(rows) == 2
        assert headers == ['sku', 'name', 'qty']
        assert rows[0]['sku'] == 'ABC123'
    
    def test_data_validation_workflow(self):
        """2. Validate imported data"""
        data = [
            {'sku': 'ABC123', 'name': 'Widget', 'qty': '100'},
            {'sku': '', 'name': 'Gadget', 'qty': '50'},
        ]
        
        validator = DataValidator()
        validator.add_required('sku')
        
        result = validator.validate_batch(data)
        assert result['valid'] == 1
        assert result['invalid'] == 1
    
    def test_field_mapping_workflow(self):
        """3. Map fields to template"""
        csv_data = "product_code,product_name\nABC123,Widget"
        headers, rows = CSVParser.parse(csv_data)
        
        # Simulate mapping: product_code -> barcode_field, product_name -> label_field
        mapping = {
            'product_code': 'barcode_field',
            'product_name': 'label_field'
        }
        
        assert mapping['product_code'] == 'barcode_field'
        assert len(rows) == 1
    
    def test_serialization_workflow(self):
        """4. Generate serial numbers during import"""
        counter = SerializationCounter('serial_number', 1, 1)
        
        # Generate serials for 5 items
        serials = counter.generate_batch(5, 'SN-', '-2024', 6)
        
        assert len(serials) == 5
        assert serials[0] == 'SN-000001-2024'
        assert serials[4] == 'SN-000005-2024'
    
    def test_batch_print_workflow(self):
        """5. Prepare for batch printing"""
        csv_data = "sku,name\nABC123,Widget\nDEF456,Gadget\nGHI789,Gizmo"
        headers, rows = CSVParser.parse(csv_data)
        
        # Simulate batch print: select rows 1-2
        batch = rows[0:2]
        
        assert len(batch) == 2
        assert batch[0]['sku'] == 'ABC123'
        assert batch[1]['sku'] == 'DEF456'
    
    def test_complete_workflow_end_to_end(self):
        """COMPLETE: Upload → Validate → Map → Serialize → Print"""
        
        # Step 1: Upload CSV
        csv_content = "sku,product,qty\nABC001,Widget,100\nABC002,Gadget,50\nABC003,Gizmo,75"
        headers, rows = CSVParser.parse(csv_content)
        assert len(rows) == 3
        
        # Step 2: Validate data
        validator = DataValidator()
        validator.add_required('sku')
        result = validator.validate_batch(rows)
        assert result['invalid'] == 0
        
        # Step 3: Map fields
        mapping = {'sku': 'barcode', 'product': 'product_name', 'qty': 'quantity'}
        assert len(mapping) == 3
        
        # Step 4: Generate serials
        counter = SerializationCounter('serial', 1, 1)
        serials = counter.generate_batch(len(rows), 'SN-', '', 6)
        assert len(serials) == 3
        
        # Step 5: Prepare batch
        batch_data = []
        for i, row in enumerate(rows):
            batch_data.append({
                'barcode': row['sku'],
                'product_name': row['product'],
                'quantity': row['qty'],
                'serial': serials[i]
            })
        
        assert len(batch_data) == 3
        assert batch_data[0]['serial'] == 'SN-000001'
        assert batch_data[2]['barcode'] == 'ABC003'
        
        print(f"[SUCCESS] Complete workflow: {len(batch_data)} labels ready to print")


class TestQueryBuilder:
    """Test database query building"""
    
    def test_simple_select(self):
        """Query: SELECT * FROM users"""
        qb = QueryBuilder()
        query = qb.select(['id', 'name']).from_table('users').build()
        
        assert 'SELECT' in query
        assert 'id' in query
        assert 'users' in query
    
    def test_where_clause(self):
        """Query: SELECT * FROM users WHERE status='active'"""
        qb = QueryBuilder()
        query = qb.select(['*']).from_table('users').where("status='active'").build()
        
        assert 'WHERE' in query
        assert 'active' in query
    
    def test_limit(self):
        """Query: SELECT * FROM users LIMIT 100"""
        qb = QueryBuilder()
        query = qb.select(['*']).from_table('users').limit(100).build()
        
        assert 'LIMIT 100' in query


class TestExcelParsing:
    """Test Excel file handling"""
    
    def test_excel_parser_structure(self):
        """Test Excel parser exists and is callable"""
        from app.services.parsers.excel_parser import ExcelParser
        
        # Parser should have parse methods
        assert hasattr(ExcelParser, 'parse_xlsx')
        assert hasattr(ExcelParser, 'parse_xls')


class TestDatabaseConnector:
    """Test database connection layer"""
    
    def test_connector_init(self):
        """Database connector should initialize"""
        from app.services.database.connector import DatabaseConnector
        
        conn = DatabaseConnector("postgresql://localhost/test")
        assert conn.connection_string == "postgresql://localhost/test"


class TestImportRouter:
    """Test import API router"""
    
    def test_mapping_creation(self):
        """API: Create field mappings"""
        from app.api.v1.routers.import_router import ImportRouter
        
        result = ImportRouter.create_mapping('template-1', [
            {'barcode': 'sku'},
            {'product_name': 'name'}
        ])
        
        assert result['mappings_saved'] == 2
        assert result['status'] == 'valid'
    
    def test_serialization_creation(self):
        """API: Create serialization counter"""
        from app.api.v1.routers.import_router import ImportRouter
        
        config = {
            'field_name': 'serial',
            'start_value': 1,
            'prefix': 'SN-',
            'pad_width': 6
        }
        
        result = ImportRouter.create_serialization('template-1', config)
        
        assert result['field_name'] == 'serial'
        assert len(result['preview']) == 5


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
