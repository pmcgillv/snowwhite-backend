"""Query Builder"""

class QueryBuilder:
    def __init__(self):
        self.table = None
        self.columns = []
        self.where_clause = None
        self.limit_value = 1000
    
    def select(self, columns: list):
        self.columns = columns
        return self
    
    def from_table(self, table: str):
        self.table = table
        return self
    
    def where(self, condition: str):
        self.where_clause = condition
        return self
    
    def limit(self, count: int):
        self.limit_value = min(count, 100000)
        return self
    
    def build(self) -> str:
        if not self.table:
            raise ValueError("Table required")
        cols = ", ".join(self.columns) if self.columns else "*"
        query = f"SELECT {cols} FROM {self.table}"
        if self.where_clause:
            query += f" WHERE {self.where_clause}"
        query += f" LIMIT {self.limit_value}"
        return query
