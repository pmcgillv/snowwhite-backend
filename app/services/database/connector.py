"""Database Connector"""
from typing import List, Dict

class DatabaseConnector:
    def __init__(self, connection_string: str):
        self.connection_string = connection_string
    
    def test_connection(self) -> bool:
        try:
            from sqlalchemy import create_engine
            engine = create_engine(self.connection_string)
            with engine.connect() as conn:
                return True
        except:
            return False
    
    def execute_query(self, query: str, limit: int = 1000) -> List[Dict]:
        try:
            from sqlalchemy import text
            from sqlalchemy import create_engine
            engine = create_engine(self.connection_string)
            with engine.connect() as conn:
                result = conn.execute(text(query))
                return [dict(row) for row in result.fetchall()[:limit]]
        except:
            return []
