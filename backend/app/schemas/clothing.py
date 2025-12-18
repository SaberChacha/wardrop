from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class ClothingImageResponse(BaseModel):
    id: int
    image_path: str
    is_primary: bool

    class Config:
        from_attributes = True


class ClothingBase(BaseModel):
    name: str
    category: str
    size: str
    color: str
    sale_price: Decimal
    stock_quantity: int
    description: Optional[str] = None


class ClothingCreate(ClothingBase):
    pass


class ClothingUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    sale_price: Optional[Decimal] = None
    stock_quantity: Optional[int] = None
    description: Optional[str] = None


class ClothingResponse(ClothingBase):
    id: int
    created_at: datetime
    images: List[ClothingImageResponse] = []

    class Config:
        from_attributes = True


class ClothingListResponse(BaseModel):
    items: List[ClothingResponse]
    total: int

