from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from enum import Enum


class ProductTypeEnum(str, Enum):
    rent = "rent"
    sale = "sale"


class ProductImageBase(BaseModel):
    image_path: str
    is_primary: bool = False


class ProductImageCreate(ProductImageBase):
    pass


class ProductImageResponse(ProductImageBase):
    id: int

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    type: ProductTypeEnum
    category_name: Optional[str] = None  # Category name for auto-create
    size_name: Optional[str] = None  # Size name for auto-create
    color: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = "available"
    
    # Rental fields
    rental_price: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    
    # Sale fields
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ProductTypeEnum] = None
    category_name: Optional[str] = None
    size_name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    rental_price: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None


class CategoryInfo(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class SizeInfo(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class ProductResponse(BaseModel):
    id: int
    name: str
    type: ProductTypeEnum
    category: Optional[CategoryInfo] = None
    size: Optional[SizeInfo] = None
    color: Optional[str] = None
    description: Optional[str] = None
    status: str
    rental_price: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    purchase_price: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    images: List[ProductImageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    id: int
    name: str
    type: ProductTypeEnum
    category: Optional[CategoryInfo] = None
    size: Optional[SizeInfo] = None
    color: Optional[str] = None
    status: str
    rental_price: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    sale_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    primary_image: Optional[str] = None

    class Config:
        from_attributes = True

