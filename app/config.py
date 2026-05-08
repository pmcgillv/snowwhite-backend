from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://snowwhite:snowwhite_dev_password@localhost:5432/snowwhite_db")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = True
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1"]

settings = Settings()
