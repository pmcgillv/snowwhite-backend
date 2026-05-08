from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def list():
    return {"message": "Coming in Week 2"}
