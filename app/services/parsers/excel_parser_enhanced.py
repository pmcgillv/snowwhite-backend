"""Enhanced Excel Parser"""
from typing import List, Dict, Tuple, Optional
import io

class ExcelFormatDetector:
    """Detect Excel file format"""
    
    @staticmethod
    def detect_format(file_path: str) -> str:
        """Detect if file is .xlsx or .xls"""
        if file_path.lower().endswith('.xlsx'):
            return 'xlsx'
        elif file_path.lower().endswith('.xls'):
            return 'xls'
        else:
            # Try to detect by reading first bytes
            with open(file_path, 'rb') as f:
                header = f.read(4)
                if header == b'PK\x03\x04':
                    return 'xlsx'
                elif header[:2] == b'\xd0\xcf':
                    return 'xls'
            return 'unknown'


class ExcelSheetInspector:
    """Inspect Excel file sheets"""
    
    @staticmethod
    def list_sheets_xlsx(file_path: str) -> List[str]:
        """List all sheets in .xlsx file"""
        try:
            from openpyxl import load_workbook
            wb = load_workbook(file_path, read_only=True, data_only=True)
            return wb.sheetnames
        except Exception as e:
            return []
    
    @staticmethod
    def list_sheets_xls(file_path: str) -> List[str]:
        """List all sheets in .xls file"""
        try:
            import xlrd
            wb = xlrd.open_workbook(file_path)
            return wb.sheet_names()
        except Exception as e:
            return []
    
    @staticmethod
    def get_sheet_info(file_path: str) -> Dict:
        """Get info about all sheets"""
        fmt = ExcelFormatDetector.detect_format(file_path)
        
        if fmt == 'xlsx':
            sheets = ExcelSheetInspector.list_sheets_xlsx(file_path)
        elif fmt == 'xls':
            sheets = ExcelSheetInspector.list_sheets_xls(file_path)
        else:
            sheets = []
        
        return {
            'format': fmt,
            'sheets': sheets,
            'sheet_count': len(sheets),
            'default_sheet': sheets[0] if sheets else None
        }


class ExcelParserEnhanced:
    """Enhanced Excel parser with all features"""
    
    def __init__(self, file_path: str):
        self.file_path = file_path
        self.format = ExcelFormatDetector.detect_format(file_path)
        self.headers = []
        self.rows = []
        self.sheet_name = None
        self.total_rows = 0
        self.errors = []
    
    def parse(self, sheet_name: Optional[str] = None, skip_empty: bool = True, chunk_size: int = 1000) -> Tuple[List[str], List[Dict]]:
        """Parse Excel file with optional sheet selection"""
        try:
            if self.format == 'xlsx':
                return self._parse_xlsx(sheet_name, skip_empty, chunk_size)
            elif self.format == 'xls':
                return self._parse_xls(sheet_name, skip_empty, chunk_size)
            else:
                self.errors.append("Unknown file format")
                return [], []
        except Exception as e:
            self.errors.append(f"Parse error: {str(e)}")
            return [], []
    
    def _parse_xlsx(self, sheet_name: Optional[str] = None, skip_empty: bool = True, chunk_size: int = 1000) -> Tuple[List[str], List[Dict]]:
        """Parse .xlsx file"""
        from openpyxl import load_workbook
        
        try:
            wb = load_workbook(self.file_path, data_only=True)
            
            # Select sheet
            if sheet_name:
                if sheet_name not in wb.sheetnames:
                    self.errors.append(f"Sheet '{sheet_name}' not found")
                    return [], []
                ws = wb[sheet_name]
                self.sheet_name = sheet_name
            else:
                ws = wb.active
                self.sheet_name = ws.title
            
            # Get headers
            headers = []
            for cell in ws[1]:
                headers.append(cell.value)
            
            self.headers = headers
            
            # Parse rows with chunking for large files
            rows = []
            row_count = 0
            
            for row_idx, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
                # Skip empty rows
                if skip_empty and all(v is None for v in row):
                    continue
                
                row_dict = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        row_dict[header] = row[i]
                
                rows.append(row_dict)
                row_count += 1
                
                # Process in chunks for memory efficiency
                if row_count % chunk_size == 0:
                    self.total_rows += len(rows)
            
            self.total_rows += len(rows)
            return headers, rows
        
        except Exception as e:
            self.errors.append(f"XLSX parsing error: {str(e)}")
            return [], []
    
    def _parse_xls(self, sheet_name: Optional[str] = None, skip_empty: bool = True, chunk_size: int = 1000) -> Tuple[List[str], List[Dict]]:
        """Parse .xls file"""
        import xlrd
        
        try:
            wb = xlrd.open_workbook(self.file_path)
            
            # Select sheet
            if sheet_name:
                try:
                    ws = wb.sheet_by_name(sheet_name)
                    self.sheet_name = sheet_name
                except:
                    self.errors.append(f"Sheet '{sheet_name}' not found")
                    return [], []
            else:
                ws = wb.sheet_by_index(0)
                self.sheet_name = ws.name
            
            # Get headers
            headers = [ws.cell_value(0, i) for i in range(ws.ncols)]
            self.headers = headers
            
            # Parse rows
            rows = []
            for row_idx in range(1, ws.nrows):
                # Skip empty rows
                row_values = [ws.cell_value(row_idx, i) for i in range(ws.ncols)]
                if skip_empty and all(v is None or str(v).strip() == "" for v in row_values):
                    continue
                
                row_dict = {}
                for col_idx, header in enumerate(headers):
                    row_dict[header] = row_values[col_idx] if col_idx < len(row_values) else None
                
                rows.append(row_dict)
            
            self.total_rows = len(rows)
            return headers, rows
        
        except Exception as e:
            self.errors.append(f"XLS parsing error: {str(e)}")
            return [], []
    
    def get_stats(self) -> Dict:
        """Get parsing statistics"""
        return {
            'file_path': self.file_path,
            'format': self.format,
            'sheet_name': self.sheet_name,
            'total_rows': self.total_rows,
            'total_columns': len(self.headers),
            'headers': self.headers,
            'errors': self.errors
        }
    
    def validate(self) -> Dict:
        """Validate parsed data"""
        issues = {
            'empty_headers': [h for h in self.headers if not h or str(h).strip() == ""],
            'duplicate_headers': [h for h in self.headers if self.headers.count(h) > 1],
            'parse_errors': self.errors,
            'total_issues': 0
        }
        
        issues['total_issues'] = sum([
            len(issues['empty_headers']),
            len(issues['duplicate_headers']),
            len(issues['parse_errors'])
        ])
        
        return issues


class ExcelBatchProcessor:
    """Process large Excel files in batches"""
    
    @staticmethod
    def process_in_batches(file_path: str, batch_size: int = 1000, sheet_name: Optional[str] = None):
        """Process Excel file in batches (memory efficient)"""
        parser = ExcelParserEnhanced(file_path)
        headers, rows = parser.parse(sheet_name, chunk_size=batch_size)
        
        batches = []
        for i in range(0, len(rows), batch_size):
            batches.append({
                'batch_number': (i // batch_size) + 1,
                'rows': rows[i:i+batch_size],
                'row_count': len(rows[i:i+batch_size])
            })
        
        return {
            'headers': headers,
            'total_rows': len(rows),
            'batch_count': len(batches),
            'batch_size': batch_size,
            'batches': batches,
            'stats': parser.get_stats()
        }
