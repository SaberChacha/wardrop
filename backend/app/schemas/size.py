from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SizeBase(BaseModel):
    name: str
    is_for_sale: bool = False


class SizeCreate(SizeBase):
    pass


class SizeUpdate(BaseModel):
    name: Optional[str] = None
    is_for_sale: Optional[bool] = None


class SizeResponse(SizeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

