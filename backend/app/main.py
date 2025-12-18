from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from .config import get_settings
from .database import engine, Base
from .routers import auth, clients, dresses, clothing, bookings, sales, reports, export, notifications

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create upload directory if it doesn't exist
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(f"{settings.upload_dir}/dresses", exist_ok=True)
    os.makedirs(f"{settings.upload_dir}/clothing", exist_ok=True)
    yield
    # Shutdown: Clean up if needed


app = FastAPI(
    title=settings.app_name,
    description="Wedding Dress Rental and Sales Management Dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(clients.router, prefix="/api/clients", tags=["Clients"])
app.include_router(dresses.router, prefix="/api/dresses", tags=["Dresses"])
app.include_router(clothing.router, prefix="/api/clothing", tags=["Clothing"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(sales.router, prefix="/api/sales", tags=["Sales"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])
app.include_router(export.router, prefix="/api/export", tags=["Export/Import"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])


@app.get("/")
async def root():
    return {
        "app": settings.app_name,
        "message": "Welcome to Wardrop Dashboard API",
        "docs": "/docs",
        "timezone": settings.timezone,
        "currency": settings.currency
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name}

