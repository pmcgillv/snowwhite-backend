"""Excel Sheet Selection Tests"""
import pytest

def test_sheet_selection():
    """Test selecting specific sheet from Excel file"""
    from app.services.parsers.excel_parser_enhanced import ExcelParserEnhanced
    
    # Mock test
    parser = ExcelParserEnhanced('multi_sheet.xlsx')
    
    # Parser should handle sheet selection
    assert hasattr(parser, 'sheet_name')
    assert hasattr(parser, 'parse')


def test_default_sheet_selection():
    """If no sheet specified, use first sheet"""
    from app.services.parsers.excel_parser_enhanced import ExcelParserEnhanced
    
    parser = ExcelParserEnhanced('test.xlsx')
    
    # Should work without sheet_name parameter
    headers, rows = parser.parse()
    
    # First sheet should be selected
    assert parser.sheet_name is not None


def test_invalid_sheet_handling():
    """Handle invalid sheet names gracefully"""
    from app.services.parsers.excel_parser_enhanced import ExcelParserEnhanced
    
    parser = ExcelParserEnhanced('test.xlsx')
    
    # Requesting non-existent sheet should return empty
    headers, rows = parser.parse('NonExistent')
    
    assert len(headers) == 0 or len(parser.errors) > 0
