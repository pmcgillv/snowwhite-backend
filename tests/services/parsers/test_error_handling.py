"""Excel Error Handling Tests"""
import pytest

def test_corrupted_file_handling():
    """Handle corrupted Excel files gracefully"""
    from app.services.parsers.excel_parser_enhanced import ExcelParserEnhanced
    
    parser = ExcelParserEnhanced('corrupted.xlsx')
    headers, rows = parser.parse()
    
    # Should not crash, should log error
    assert isinstance(parser.errors, list)


def test_missing_file_handling():
    """Handle missing files gracefully"""
    from app.services.parsers.excel_parser_enhanced import ExcelParserEnhanced
    
    parser = ExcelParserEnhanced('/nonexistent/file.xlsx')
    
    # Parser should initialize
    assert parser.file_path == '/nonexistent/file.xlsx'


def test_empty_file_handling():
    """Handle empty Excel files"""
    from app.services.parsers.excel_parser_enhanced import ExcelParserEnhanced
    
    # Mock empty file
    parser = ExcelParserEnhanced('empty.xlsx')
    
    # Should return empty headers and rows
    headers, rows = parser.parse()
    assert headers == [] or all(h is None for h in headers)


def test_validation_errors():
    """Test data validation errors"""
    from app.services.parsers.excel_parser_enhanced import ExcelParserEnhanced
    
    parser = ExcelParserEnhanced('test.xlsx')
    
    # Mock validation
    validation = parser.validate()
    
    assert 'empty_headers' in validation
    assert 'duplicate_headers' in validation
    assert 'parse_errors' in validation


def test_skip_empty_rows():
    """Test skip_empty parameter"""
    from app.services.parsers.excel_parser_enhanced import ExcelParserEnhanced
    
    parser = ExcelParserEnhanced('test.xlsx')
    
    # Should skip empty rows when requested
    headers, rows = parser.parse(skip_empty=True)
    
    # No completely empty rows should be present
    assert all(any(v for v in row.values()) for row in rows)
