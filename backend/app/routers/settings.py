from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
import os
import uuid

from ..database import get_db
from ..config import get_settings
from ..models.settings import Settings
from ..schemas.settings import SettingsUpdate, SettingsResponse
from .auth import get_current_user

router = APIRouter()
config = get_settings()


def get_or_create_settings(db: Session) -> Settings:
    """Get settings or create default if not exists"""
    settings = db.query(Settings).first()
    if not settings:
        settings = Settings(
            language="fr",
            brand_name="Wardrop",
            currency="DZD"
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings


@router.get("/", response_model=SettingsResponse)
async def get_app_settings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get application settings"""
    return get_or_create_settings(db)


@router.get("/public", response_model=SettingsResponse)
async def get_public_settings(
    db: Session = Depends(get_db)
):
    """Get public settings (no auth required - for login page)"""
    return get_or_create_settings(db)


@router.put("/", response_model=SettingsResponse)
async def update_settings(
    settings_update: SettingsUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update application settings"""
    settings = get_or_create_settings(db)
    
    update_data = settings_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings


@router.post("/logo", response_model=SettingsResponse)
async def upload_logo(
    logo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload brand logo"""
    settings = get_or_create_settings(db)
    
    # Validate file extension
    ext = logo.filename.split(".")[-1].lower()
    if ext not in config.allowed_extensions:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Create logos directory if not exists
    logos_dir = f"{config.upload_dir}/logos"
    os.makedirs(logos_dir, exist_ok=True)
    
    # Delete old logo if exists
    if settings.logo_path:
        old_path = f".{settings.logo_path}"
        if os.path.exists(old_path):
            os.remove(old_path)
    
    # Save new logo
    filename = f"logo_{uuid.uuid4()}.{ext}"
    filepath = f"{logos_dir}/{filename}"
    
    with open(filepath, "wb") as f:
        content = await logo.read()
        f.write(content)
    
    settings.logo_path = f"/uploads/logos/{filename}"
    db.commit()
    db.refresh(settings)
    
    return settings


@router.delete("/logo", response_model=SettingsResponse)
async def delete_logo(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete brand logo"""
    settings = get_or_create_settings(db)
    
    if settings.logo_path:
        filepath = f".{settings.logo_path}"
        if os.path.exists(filepath):
            os.remove(filepath)
        settings.logo_path = None
        db.commit()
        db.refresh(settings)
    
    return settings

