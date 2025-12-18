from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class SettingsBase(BaseModel):
    language: Optional[str] = "fr"
    brand_name: Optional[str] = "Wardrop"
    logo_path: Optional[str] = None
    currency: Optional[str] = "DZD"


class SettingsUpdate(BaseModel):
    language: Optional[str] = None
    brand_name: Optional[str] = None
    currency: Optional[str] = None


class SettingsResponse(SettingsBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

