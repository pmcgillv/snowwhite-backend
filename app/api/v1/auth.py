from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.security import hash_password, verify_password, create_access_token, verify_token
from app.database_models import User, Organization
from app.dependencies import generate_id, get_current_user

router = APIRouter()

@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    org = Organization(
        id=generate_id(),
        name=request.organization_name,
        slug=request.organization_name.lower()
    )
    db.add(org)
    db.commit()
    
    user = User(
        id=generate_id(),
        email=request.email,
        full_name=request.full_name,
        password_hash=hash_password(request.password),
        organization_id=org.id,
        role="admin"
    )
    db.add(user)
    db.commit()
    return {"message": "Account created successfully", "user_id": user.id}

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"sub": user.id})
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "full_name": user.full_name}

@router.post("/logout")
async def logout(user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}
