from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import asc, desc
from typing import Optional, Literal
from datetime import date

from ..database import get_db
from ..models.sale import Sale
from ..models.clothing import Clothing, ClothingImage
from ..schemas.sale import SaleCreate, SaleUpdate, SaleResponse, SaleListResponse
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=SaleListResponse)
async def get_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    client_id: Optional[int] = None,
    clothing_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: Optional[str] = Query("sale_date", description="Field to sort by: sale_date, total_price, created_at"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("desc", description="Sort order"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all sales with optional filters, sorting, and pagination"""
    query = db.query(Sale).options(
        joinedload(Sale.client),
        joinedload(Sale.clothing).joinedload(Clothing.images)
    )
    
    if client_id:
        query = query.filter(Sale.client_id == client_id)
    
    if clothing_id:
        query = query.filter(Sale.clothing_id == clothing_id)
    
    if start_date:
        query = query.filter(Sale.sale_date >= start_date)
    
    if end_date:
        query = query.filter(Sale.sale_date <= end_date)
    
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Sale, sort_by, Sale.sale_date)
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    sales = query.offset(skip).limit(limit).all()
    
    return {"sales": sales, "total": total}


@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific sale by ID"""
    sale = db.query(Sale).options(
        joinedload(Sale.client),
        joinedload(Sale.clothing)
    ).filter(Sale.id == sale_id).first()
    
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("/", response_model=SaleResponse)
async def create_sale(
    sale: SaleCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new sale and update stock"""
    # Check clothing item exists and has stock
    clothing = db.query(Clothing).filter(Clothing.id == sale.clothing_id).first()
    if not clothing:
        raise HTTPException(status_code=404, detail="Clothing item not found")
    
    if clothing.stock_quantity < sale.quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock. Available: {clothing.stock_quantity}"
        )
    
    # Calculate total price
    unit_price = sale.unit_price or clothing.sale_price
    total_price = unit_price * sale.quantity
    
    db_sale = Sale(
        client_id=sale.client_id,
        clothing_id=sale.clothing_id,
        quantity=sale.quantity,
        unit_price=unit_price,
        total_price=total_price,
        sale_date=sale.sale_date or date.today(),
        notes=sale.notes
    )
    db.add(db_sale)
    
    # Deduct from stock
    clothing.stock_quantity -= sale.quantity
    
    db.commit()
    db.refresh(db_sale)
    
    # Reload with relationships
    return db.query(Sale).options(
        joinedload(Sale.client),
        joinedload(Sale.clothing)
    ).filter(Sale.id == db_sale.id).first()


@router.put("/{sale_id}", response_model=SaleResponse)
async def update_sale(
    sale_id: int,
    sale: SaleUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing sale"""
    db_sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not db_sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    update_data = sale.model_dump(exclude_unset=True)
    
    # Handle quantity change - adjust stock
    if "quantity" in update_data:
        clothing = db.query(Clothing).filter(Clothing.id == db_sale.clothing_id).first()
        quantity_diff = update_data["quantity"] - db_sale.quantity
        
        if quantity_diff > 0 and clothing.stock_quantity < quantity_diff:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock. Available: {clothing.stock_quantity}"
            )
        
        clothing.stock_quantity -= quantity_diff
        
        # Recalculate total
        unit_price = update_data.get("unit_price", db_sale.unit_price)
        update_data["total_price"] = unit_price * update_data["quantity"]
    elif "unit_price" in update_data:
        update_data["total_price"] = update_data["unit_price"] * db_sale.quantity
    
    for field, value in update_data.items():
        setattr(db_sale, field, value)
    
    db.commit()
    db.refresh(db_sale)
    
    return db.query(Sale).options(
        joinedload(Sale.client),
        joinedload(Sale.clothing)
    ).filter(Sale.id == db_sale.id).first()


@router.delete("/{sale_id}")
async def delete_sale(
    sale_id: int,
    restore_stock: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a sale and optionally restore stock"""
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Restore stock if requested
    if restore_stock:
        clothing = db.query(Clothing).filter(Clothing.id == sale.clothing_id).first()
        if clothing:
            clothing.stock_quantity += sale.quantity
    
    db.delete(sale)
    db.commit()
    return {"message": "Sale deleted successfully", "stock_restored": restore_stock}


@router.post("/bulk-delete")
async def bulk_delete_sales(
    ids: list[int],
    restore_stock: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete multiple sales by IDs and optionally restore stock"""
    # First, restore stock for each sale if requested
    if restore_stock:
        sales = db.query(Sale).filter(Sale.id.in_(ids)).all()
        for sale in sales:
            clothing = db.query(Clothing).filter(Clothing.id == sale.clothing_id).first()
            if clothing:
                clothing.stock_quantity += sale.quantity
    
    # Now delete the sales
    deleted_count = db.query(Sale).filter(Sale.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"message": f"{deleted_count} sales deleted successfully", "deleted_count": deleted_count, "stock_restored": restore_stock}

