"""Tests"""
import pytest
from app.services.parsers.csv_parser import CSVParser

def test_parse():
    headers, rows = CSVParser.parse("name,email\nJohn,john@test.com")
    assert len(rows) == 1
    assert rows[0]['name'] == 'John'

def test_delimiter():
    headers, rows = CSVParser.parse("name\temail\nJohn\tjohn@test.com")
    assert rows[0]['name'] == 'John'
