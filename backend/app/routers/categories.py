from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.category import Category
from ..schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[CategoryResponse])
async def get_categories(
    is_for_sale: Optional[bool] = Query(None, description="Filter by sale/rent type"),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all categories with optional filters"""
    query = db.query(Category)
    
    if is_for_sale is not None:
        query = query.filter(Category.is_for_sale == is_for_sale)
    
    if search:
        query = query.filter(Category.name.ilike(f"%{search}%"))
    
    return query.order_by(Category.name).all()


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific category by ID"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


@router.post("/", response_model=CategoryResponse)
async def create_category(
    category: CategoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new category"""
    # Check if category already exists with same name and type
    existing = db.query(Category).filter(
        Category.name == category.name,
        Category.is_for_sale == category.is_for_sale
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")
    
    db_category = Category(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: int,
    category: CategoryUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing category"""
    db_category = db.query(Category).filter(Category.id == category_id).first()
    if not db_category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_category, field, value)
    
    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a category"""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    db.delete(category)
    db.commit()
    return {"message": "Category deleted successfully"}


def get_or_create_category(db: Session, name: str, is_for_sale: bool) -> Category:
    """Get existing category or create new one - helper function for product creation"""
    if not name:
        return None
    
    category = db.query(Category).filter(
        Category.name == name,
        Category.is_for_sale == is_for_sale
    ).first()
    
    if not category:
        category = Category(name=name, is_for_sale=is_for_sale)
        db.add(category)
        db.flush()  # Get the ID without committing
    
    return category

