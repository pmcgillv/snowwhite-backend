"""CSV Parser"""
import csv
from typing import List, Dict, Tuple
from io import StringIO

class CSVParser:
    @staticmethod
    def detect_delimiter(content: str) -> str:
        for delim in [',', '\t', ';', '|']:
            if content.count(delim) > 5:
                return delim
        return ','
    
    @staticmethod
    def parse(content: str) -> Tuple[List[str], List[Dict]]:
        delimiter = CSVParser.detect_delimiter(content)
        reader = csv.DictReader(StringIO(content), delimiter=delimiter)
        return list(reader.fieldnames or []), list(reader)
