from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import os
import uuid

from ..database import get_db
from ..config import get_settings
from ..models.clothing import Clothing, ClothingImage
from ..schemas.clothing import ClothingCreate, ClothingUpdate, ClothingResponse, ClothingListResponse
from .auth import get_current_user

router = APIRouter()
settings = get_settings()


@router.get("/", response_model=ClothingListResponse)
async def get_clothing(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    size: Optional[str] = None,
    in_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all clothing items with optional filters and pagination"""
    query = db.query(Clothing)
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Clothing.name.ilike(search_filter),
                Clothing.description.ilike(search_filter)
            )
        )
    
    if category:
        query = query.filter(Clothing.category == category)
    
    if size:
        query = query.filter(Clothing.size == size)
    
    if in_stock is not None:
        if in_stock:
            query = query.filter(Clothing.stock_quantity > 0)
        else:
            query = query.filter(Clothing.stock_quantity == 0)
    
    total = query.count()
    items = query.order_by(Clothing.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"items": items, "total": total}


@router.get("/{item_id}", response_model=ClothingResponse)
async def get_clothing_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific clothing item by ID"""
    item = db.query(Clothing).filter(Clothing.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    return item


@router.post("/", response_model=ClothingResponse)
async def create_clothing(
    name: str = Form(...),
    category: str = Form(...),
    size: str = Form(...),
    color: str = Form(...),
    sale_price: float = Form(...),
    stock_quantity: int = Form(...),
    description: Optional[str] = Form(None),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new clothing item with optional images"""
    db_item = Clothing(
        name=name,
        category=category,
        size=size,
        color=color,
        sale_price=sale_price,
        stock_quantity=stock_quantity,
        description=description
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    
    # Handle image uploads
    for idx, image in enumerate(images):
        if image.filename:
            ext = image.filename.split(".")[-1].lower()
            if ext not in settings.allowed_extensions:
                continue
            
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = f"{settings.upload_dir}/clothing/{filename}"
            
            with open(filepath, "wb") as f:
                content = await image.read()
                f.write(content)
            
            db_image = ClothingImage(
                clothing_id=db_item.id,
                image_path=f"/uploads/clothing/{filename}",
                is_primary=(idx == 0)
            )
            db.add(db_image)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.put("/{item_id}", response_model=ClothingResponse)
async def update_clothing(
    item_id: int,
    item: ClothingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing clothing item"""
    db_item = db.query(Clothing).filter(Clothing.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    
    update_data = item.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_item, field, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.post("/{item_id}/images")
async def upload_clothing_images(
    item_id: int,
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload additional images for a clothing item"""
    item = db.query(Clothing).filter(Clothing.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    
    uploaded = []
    for image in images:
        if image.filename:
            ext = image.filename.split(".")[-1].lower()
            if ext not in settings.allowed_extensions:
                continue
            
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = f"{settings.upload_dir}/clothing/{filename}"
            
            with open(filepath, "wb") as f:
                content = await image.read()
                f.write(content)
            
            db_image = ClothingImage(
                clothing_id=item_id,
                image_path=f"/uploads/clothing/{filename}",
                is_primary=False
            )
            db.add(db_image)
            uploaded.append(db_image.image_path)
    
    db.commit()
    return {"uploaded": uploaded}


@router.delete("/{item_id}/images/{image_id}")
async def delete_clothing_image(
    item_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a clothing image"""
    image = db.query(ClothingImage).filter(
        ClothingImage.id == image_id,
        ClothingImage.clothing_id == item_id
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


@router.delete("/{item_id}")
async def delete_clothing(
    item_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a clothing item and its images"""
    item = db.query(Clothing).filter(Clothing.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    
    # Delete associated images from disk
    for image in item.images:
        filepath = f".{image.image_path}"
        if os.path.exists(filepath):
            os.remove(filepath)
    
    db.delete(item)
    db.commit()
    return {"message": "Clothing item deleted successfully"}

