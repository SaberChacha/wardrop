from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, asc, desc
from typing import List, Optional, Literal
import os
import uuid

from ..database import get_db
from ..config import get_settings
from ..models.product import Product, ProductImage, ProductType
from ..models.category import Category
from ..models.size import Size
from ..schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ProductTypeEnum
)
from .auth import get_current_user
from .categories import get_or_create_category
from .sizes import get_or_create_size

router = APIRouter()
settings = get_settings()


@router.get("/", response_model=dict)
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    type: Optional[ProductTypeEnum] = Query(None, description="Filter by product type: rent or sale"),
    search: Optional[str] = None,
    status: Optional[str] = None,
    category_id: Optional[int] = None,
    size_id: Optional[int] = None,
    sort_by: Optional[str] = Query("created_at", description="Field to sort by"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("desc", description="Sort order"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all products with optional filters, sorting, and pagination"""
    query = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.size),
        joinedload(Product.images)
    )
    
    if type:
        query = query.filter(Product.type == ProductType(type.value))
    
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Product.name.ilike(search_filter),
                Product.description.ilike(search_filter)
            )
        )
    
    if status:
        query = query.filter(Product.status == status)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if size_id:
        query = query.filter(Product.size_id == size_id)
    
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Product, sort_by, Product.created_at)
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    products = query.offset(skip).limit(limit).all()
    
    # Format response with primary image
    result = []
    for product in products:
        primary_image = next((img.image_path for img in product.images if img.is_primary), None)
        if not primary_image and product.images:
            primary_image = product.images[0].image_path
        
        result.append({
            "id": product.id,
            "name": product.name,
            "type": product.type.value,
            "category": {"id": product.category.id, "name": product.category.name} if product.category else None,
            "size": {"id": product.size.id, "name": product.size.name} if product.size else None,
            "color": product.color,
            "status": product.status,
            "rental_price": product.rental_price,
            "deposit_amount": product.deposit_amount,
            "sale_price": product.sale_price,
            "stock_quantity": product.stock_quantity,
            "primary_image": primary_image
        })
    
    return {"products": result, "total": total}


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific product by ID"""
    product = db.query(Product).options(
        joinedload(Product.category),
        joinedload(Product.size),
        joinedload(Product.images)
    ).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductResponse)
async def create_product(
    name: str = Form(...),
    type: str = Form(...),  # "rent" or "sale"
    category_name: Optional[str] = Form(None),
    size_name: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    rental_price: Optional[float] = Form(None),
    deposit_amount: Optional[float] = Form(None),
    purchase_price: Optional[float] = Form(None),
    sale_price: Optional[float] = Form(None),
    stock_quantity: Optional[int] = Form(None),
    images: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new product with optional images"""
    product_type = ProductType(type)
    is_for_sale = (product_type == ProductType.sale)
    
    # Get or create category and size
    category = get_or_create_category(db, category_name, is_for_sale) if category_name else None
    size = get_or_create_size(db, size_name, is_for_sale) if size_name else None
    
    # Determine status
    if product_type == ProductType.sale:
        status = "available" if stock_quantity and stock_quantity > 0 else "sold_out"
    else:
        status = "available"
    
    db_product = Product(
        name=name,
        type=product_type,
        category_id=category.id if category else None,
        size_id=size.id if size else None,
        color=color,
        description=description,
        status=status,
        rental_price=rental_price,
        deposit_amount=deposit_amount,
        purchase_price=purchase_price,
        sale_price=sale_price,
        stock_quantity=stock_quantity
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    # Handle image uploads
    upload_subdir = "products"
    os.makedirs(f"{settings.upload_dir}/{upload_subdir}", exist_ok=True)
    
    for idx, image in enumerate(images):
        if image.filename:
            ext = image.filename.split(".")[-1].lower()
            if ext not in settings.allowed_extensions:
                continue
            
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = f"{settings.upload_dir}/{upload_subdir}/{filename}"
            
            with open(filepath, "wb") as f:
                content = await image.read()
                f.write(content)
            
            db_image = ProductImage(
                product_id=db_product.id,
                image_path=f"/uploads/{upload_subdir}/{filename}",
                is_primary=(idx == 0)
            )
            db.add(db_image)
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    name: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    category_name: Optional[str] = Form(None),
    size_name: Optional[str] = Form(None),
    color: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    status: Optional[str] = Form(None),
    rental_price: Optional[float] = Form(None),
    deposit_amount: Optional[float] = Form(None),
    purchase_price: Optional[float] = Form(None),
    sale_price: Optional[float] = Form(None),
    stock_quantity: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing product"""
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Determine is_for_sale based on type
    if type:
        db_product.type = ProductType(type)
    is_for_sale = (db_product.type == ProductType.sale)
    
    # Update category if provided
    if category_name is not None:
        if category_name:
            category = get_or_create_category(db, category_name, is_for_sale)
            db_product.category_id = category.id
        else:
            db_product.category_id = None
    
    # Update size if provided
    if size_name is not None:
        if size_name:
            size = get_or_create_size(db, size_name, is_for_sale)
            db_product.size_id = size.id
        else:
            db_product.size_id = None
    
    # Update other fields
    if name is not None:
        db_product.name = name
    if color is not None:
        db_product.color = color
    if description is not None:
        db_product.description = description
    if status is not None:
        db_product.status = status
    if rental_price is not None:
        db_product.rental_price = rental_price
    if deposit_amount is not None:
        db_product.deposit_amount = deposit_amount
    if purchase_price is not None:
        db_product.purchase_price = purchase_price
    if sale_price is not None:
        db_product.sale_price = sale_price
    if stock_quantity is not None:
        db_product.stock_quantity = stock_quantity
        # Update status based on stock for sale products
        if is_for_sale:
            db_product.status = "available" if stock_quantity > 0 else "sold_out"
    
    db.commit()
    db.refresh(db_product)
    return db_product


@router.post("/{product_id}/images")
async def upload_product_images(
    product_id: int,
    images: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Upload additional images for a product"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    upload_subdir = "products"
    os.makedirs(f"{settings.upload_dir}/{upload_subdir}", exist_ok=True)
    
    uploaded = []
    for image in images:
        if image.filename:
            ext = image.filename.split(".")[-1].lower()
            if ext not in settings.allowed_extensions:
                continue
            
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = f"{settings.upload_dir}/{upload_subdir}/{filename}"
            
            with open(filepath, "wb") as f:
                content = await image.read()
                f.write(content)
            
            db_image = ProductImage(
                product_id=product_id,
                image_path=f"/uploads/{upload_subdir}/{filename}",
                is_primary=False
            )
            db.add(db_image)
            uploaded.append(db_image.image_path)
    
    db.commit()
    return {"uploaded": uploaded}


@router.delete("/{product_id}/images/{image_id}")
async def delete_product_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a product image"""
    image = db.query(ProductImage).filter(
        ProductImage.id == image_id,
        ProductImage.product_id == product_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Delete file from disk
    filename = image.image_path.replace("/uploads/", "")
    filepath = os.path.join(settings.upload_dir, filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    
    db.delete(image)
    db.commit()
    return {"message": "Image deleted successfully"}


@router.put("/{product_id}/images/{image_id}/primary")
async def set_primary_image(
    product_id: int,
    image_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Set an image as primary for a product"""
    # First, verify the image belongs to the product
    image = db.query(ProductImage).filter(
        ProductImage.id == image_id,
        ProductImage.product_id == product_id
    ).first()
    
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Set all other images as non-primary
    db.query(ProductImage).filter(
        ProductImage.product_id == product_id
    ).update({"is_primary": False})
    
    # Set this image as primary
    image.is_primary = True
    db.commit()
    
    return {"message": "Primary image updated"}


@router.delete("/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a product and its images"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Delete associated images from disk
    for image in product.images:
        filename = image.image_path.replace("/uploads/", "")
        filepath = os.path.join(settings.upload_dir, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

