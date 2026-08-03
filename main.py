from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, users, templates, labels, integrations, batch_labels
from app.api.v1.routers.qrcode_router import router as qrcode_router
from app.api.v1.routers.phase2_router import router as phase2_router
from app.api.v1.routers.pdf_barcode_router import router as pdf_barcode_router
from app.database import Base, engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SnowWhite API",
    description="Enterprise Label & QR Code Generation System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# CORS - MUST be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins - PERMANENTLY
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logger.info("CORS middleware configured - all origins allowed")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "SnowWhite API"}

# API v1 routes
app.include_router(auth.router, prefix="/api/v1/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(templates.router, prefix="/api/v1/templates", tags=["templates"])
app.include_router(labels.router, prefix="/api/v1/labels", tags=["labels"])
app.include_router(integrations.router, prefix="/api/v1/integrations", tags=["integrations"])
app.include_router(batch_labels.router)
app.include_router(qrcode_router)
app.include_router(phase2_router)
app.include_router(pdf_barcode_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)