"""Data Validator"""
from typing import List, Dict

class ValidationError:
    def __init__(self, field: str, row: int, message: str):
        self.field = field
        self.row = row
        self.message = message

class DataValidator:
    def __init__(self):
        self.rules = {}
    
    def add_required(self, field: str):
        if field not in self.rules:
            self.rules[field] = []
        self.rules[field].append('required')
    
    def validate_row(self, row: Dict, row_num: int) -> List[ValidationError]:
        errors = []
        for field, rules in self.rules.items():
            value = row.get(field)
            if 'required' in rules and (value is None or str(value).strip() == ""):
                errors.append(ValidationError(field, row_num, f"{field} required"))
        return errors
    
    def validate_batch(self, rows: List[Dict]) -> Dict:
        all_errors = []
        for i, row in enumerate(rows, 1):
            errors = self.validate_row(row, i)
            all_errors.extend(errors)
        return {
            'valid': len(rows) - len(all_errors),
            'invalid': len(all_errors),
            'errors': all_errors
        }
