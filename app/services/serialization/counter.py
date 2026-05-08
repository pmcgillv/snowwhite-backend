"""Serialization Counter Engine"""
from typing import List

class CounterFormatter:
    @staticmethod
    def format(value: int, prefix: str = "", suffix: str = "", pad_width: int = 0) -> str:
        str_value = str(value)
        if pad_width > 0:
            str_value = str_value.rjust(pad_width, '0')
        return f"{prefix}{str_value}{suffix}"

class SerializationCounter:
    def __init__(self, field_name: str, start_value: int = 1, increment: int = 1):
        self.field_name = field_name
        self.current_value = start_value
        self.start_value = start_value
        self.increment = increment
        self.total_printed = 0
    
    def generate_next(self, prefix: str = "", suffix: str = "", pad_width: int = 0) -> str:
        formatted = CounterFormatter.format(self.current_value, prefix, suffix, pad_width)
        self.current_value += self.increment
        self.total_printed += 1
        return formatted
    
    def generate_batch(self, count: int, prefix: str = "", suffix: str = "", pad_width: int = 0) -> List[str]:
        results = []
        for _ in range(count):
            results.append(self.generate_next(prefix, suffix, pad_width))
        return results
    
    def get_preview(self, count: int, prefix: str = "", suffix: str = "", pad_width: int = 0) -> List[str]:
        preview = []
        temp_value = self.current_value
        for _ in range(count):
            preview.append(CounterFormatter.format(temp_value, prefix, suffix, pad_width))
            temp_value += self.increment
        return preview