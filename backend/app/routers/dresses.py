from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import os
import uuid
from datetime import datetime

from ..database import get_db
from ..config import get_settings
from ..models.dress import Dress, DressImage
from ..schemas.dress import DressCreate, DressUpdate, DressResponse, DressListResponse
from .auth import get_current_user

router = APIRouter()
settings = get_settings()


@router.get("/", response_model=DressListResponse)
async def get_dresses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    size: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all dresses with optional filters and pagination"""
    query = db.query(Dress)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Dress.name.ilike(search_filter),
                Dress.description.ilike(search_filter)
            )
        )
    
    if status:
        query = query.filter(Dress.status == status)
    
    if category:
        query = query.filter(Dress.category == category)
    
    if size:
        query = query.filter(Dress.size == size)
    
    total = query.count()
    dresses = query.order_by(Dress.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"dresses": dresses, "total": total}


@router.get("/{dress_id}", response_model=DressResponse)
async def get_dress(
    dress_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific dress by ID"""
    dress = db.query(Dress).filter(Dress.id == dress_id).first()
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")
    return dress


@router.post("/", response_model=DressResponse)
async def create_dress(
    name: str = Form(...),
    category: str = Form(...),
    size: str = Form(...),
    color: str = Form(...),
    rental_price: float = Form(...),
    deposit_amount: float = Form(...),
    description: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new dress with optional images"""
    db_dress = Dress(
        name=name,
        category=category,
        size=size,
        color=color,
        rental_price=rental_price,
        deposit_amount=deposit_amount,
        description=description,
        status="available"
    )
    db.add(db_dress)
    db.commit()
    db.refresh(db_dress)
    
    # Handle image uploads
    for idx, image in enumerate(images):
        if image.filename:
            ext = image.filename.split(".")[-1].lower()
            if ext not in settings.allowed_extensions:
                continue
            
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = f"{settings.upload_dir}/dresses/{filename}"
            
            with open(filepath, "wb") as f:
                content = await image.read()
                f.write(content)
            
            db_image = DressImage(
                dress_id=db_dress.id,
                image_path=f"/uploads/dresses/{filename}",
                is_primary=(idx == 0)
            )
            db.add(db_image)
    
    db.commit()
    db.refresh(db_dress)
    return db_dress


@router.put("/{dress_id}", response_model=DressResponse)
async def update_dress(
    dress_id: int,
    dress: DressUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing dress"""
    db_dress = db.query(Dress).filter(Dress.id == dress_id).first()
    if not db_dress:
        raise HTTPException(status_code=404, detail="Dress not found")
    
    update_data = dress.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_dress, field, value)
    
    db.commit()
    db.refresh(db_dress)
    return db_dress


@router.post("/{dress_id}/images")
async def upload_dress_images(
    dress_id: int,
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload additional images for a dress"""
    dress = db.query(Dress).filter(Dress.id == dress_id).first()
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")
    
    uploaded = []
    for image in images:
        if image.filename:
            ext = image.filename.split(".")[-1].lower()
            if ext not in settings.allowed_extensions:
                continue
            
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = f"{settings.upload_dir}/dresses/{filename}"
            
            with open(filepath, "wb") as f:
                content = await image.read()
                f.write(content)
            
            db_image = DressImage(
                dress_id=dress_id,
                image_path=f"/uploads/dresses/{filename}",
                is_primary=False
            )
            db.add(db_image)
            uploaded.append(db_image.image_path)
    
    db.commit()
    return {"uploaded": uploaded}


@router.delete("/{dress_id}/images/{image_id}")
async def delete_dress_image(
    dress_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a dress image"""
    image = db.query(DressImage).filter(
        DressImage.id == image_id,
        DressImage.dress_id == dress_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete file from disk
    filepath = f".{image.image_path}"
    if os.path.exists(filepath):
        os.remove(filepath)
    
    db.delete(image)
    db.commit()
    return {"message": "Image deleted successfully"}


@router.delete("/{dress_id}")
async def delete_dress(
    dress_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a dress and its images"""
    dress = db.query(Dress).filter(Dress.id == dress_id).first()
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")
    
    # Delete associated images from disk
    for image in dress.images:
        filepath = f".{image.image_path}"
        if os.path.exists(filepath):
            os.remove(filepath)
    
    db.delete(dress)
    db.commit()
    return {"message": "Dress deleted successfully"}

