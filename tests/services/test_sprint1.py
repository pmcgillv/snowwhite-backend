"""Sprint 1 Tests"""
import pytest
from app.services.parsers.csv_parser import CSVParser
from app.services.validators.data_validator import DataValidator
from app.services.serialization.counter import SerializationCounter

def test_csv_parser():
    headers, rows = CSVParser.parse("name,email\nJohn,john@test.com")
    assert len(rows) == 1
    assert rows[0]['name'] == 'John'

def test_csv_delimiter():
    headers, rows = CSVParser.parse("name\temail\nJohn\tjohn@test.com")
    assert rows[0]['name'] == 'John'

def test_validator():
    v = DataValidator()
    v.add_required('name')
    errors = v.validate_row({}, 1)
    assert len(errors) == 1

def test_counter():
    c = SerializationCounter('serial', 1, 1)
    val = c.generate_next('SN-', '', 6)
    assert 'SN-' in val
    assert '000001' in val
