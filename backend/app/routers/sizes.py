from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.size import Size
from ..schemas.size import SizeCreate, SizeUpdate, SizeResponse
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[SizeResponse])
async def get_sizes(
    is_for_sale: Optional[bool] = Query(None, description="Filter by sale/rent type"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all sizes with optional filters"""
    query = db.query(Size)
    
    if is_for_sale is not None:
        query = query.filter(Size.is_for_sale == is_for_sale)
    
    if search:
        query = query.filter(Size.name.ilike(f"%{search}%"))
    
    return query.order_by(Size.name).all()


@router.get("/{size_id}", response_model=SizeResponse)
async def get_size(
    size_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific size by ID"""
    size = db.query(Size).filter(Size.id == size_id).first()
    if not size:
        raise HTTPException(status_code=404, detail="Size not found")
    return size


@router.post("/", response_model=SizeResponse)
async def create_size(
    size: SizeCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new size"""
    # Check if size already exists with same name and type
    existing = db.query(Size).filter(
        Size.name == size.name,
        Size.is_for_sale == size.is_for_sale
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Size already exists")
    
    db_size = Size(**size.model_dump())
    db.add(db_size)
    db.commit()
    db.refresh(db_size)
    return db_size


@router.put("/{size_id}", response_model=SizeResponse)
async def update_size(
    size_id: int,
    size: SizeUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing size"""
    db_size = db.query(Size).filter(Size.id == size_id).first()
    if not db_size:
        raise HTTPException(status_code=404, detail="Size not found")
    
    update_data = size.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_size, field, value)
    
    db.commit()
    db.refresh(db_size)
    return db_size


@router.delete("/{size_id}")
async def delete_size(
    size_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a size"""
    size = db.query(Size).filter(Size.id == size_id).first()
    if not size:
        raise HTTPException(status_code=404, detail="Size not found")
    
    db.delete(size)
    db.commit()
    return {"message": "Size deleted successfully"}


def get_or_create_size(db: Session, name: str, is_for_sale: bool) -> Size:
    """Get existing size or create new one - helper function for product creation"""
    if not name:
        return None
    
    size = db.query(Size).filter(
        Size.name == name,
        Size.is_for_sale == is_for_sale
    ).first()
    
    if not size:
        size = Size(name=name, is_for_sale=is_for_sale)
        db.add(size)
        db.flush()  # Get the ID without committing
    
    return size

