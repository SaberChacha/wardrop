from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from .client import ClientResponse
from .clothing import ClothingResponse
from .product import ProductResponse


class SaleBase(BaseModel):
    client_id: int
    clothing_id: Optional[int] = None  # Legacy - optional for backward compatibility
    product_id: Optional[int] = None  # New unified product reference
    quantity: int = 1
    unit_price: Optional[Decimal] = None
    sale_date: Optional[date] = None
    notes: Optional[str] = None


class SaleCreate(SaleBase):
    pass


class SaleUpdate(BaseModel):
    quantity: Optional[int] = None
    unit_price: Optional[Decimal] = None
    sale_date: Optional[date] = None
    notes: Optional[str] = None


class SaleResponse(BaseModel):
    id: int
    client_id: int
    clothing_id: Optional[int] = None
    product_id: Optional[int] = None
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    sale_date: date
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None
    client: Optional[ClientResponse] = None
    clothing: Optional[ClothingResponse] = None
    product: Optional[ProductResponse] = None

    class Config:
        from_attributes = True


class SaleListResponse(BaseModel):
    sales: List[SaleResponse]
    total: int

