from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class DressImageResponse(BaseModel):
    id: int
    image_path: str
    is_primary: bool

    class Config:
        from_attributes = True


class DressBase(BaseModel):
    name: str
    category: str
    size: str
    color: str
    rental_price: Decimal
    deposit_amount: Decimal
    description: Optional[str] = None


class DressCreate(DressBase):
    pass


class DressUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    rental_price: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    status: Optional[str] = None
    description: Optional[str] = None


class DressResponse(DressBase):
    id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    images: List[DressImageResponse] = []

    class Config:
        from_attributes = True


class DressListResponse(BaseModel):
    dresses: List[DressResponse]
    total: int

