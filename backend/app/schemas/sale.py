from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from .client import ClientResponse
from .clothing import ClothingResponse


class SaleBase(BaseModel):
    client_id: int
    clothing_id: int
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
    clothing_id: int
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    sale_date: date
    notes: Optional[str]
    created_at: datetime
    client: Optional[ClientResponse] = None
    clothing: Optional[ClothingResponse] = None

    class Config:
        from_attributes = True


class SaleListResponse(BaseModel):
    sales: List[SaleResponse]
    total: int

