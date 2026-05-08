from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app.security import verify_token
from app.database_models import User
import uuid

security = HTTPBearer()

async def get_current_user(credentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def generate_id() -> str:
    return str(uuid.uuid4())
