from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal

from .client import ClientResponse
from .dress import DressResponse


class BookingBase(BaseModel):
    client_id: int
    dress_id: int
    start_date: date
    end_date: date
    rental_price: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    deposit_status: Optional[str] = "pending"
    booking_status: Optional[str] = "confirmed"
    notes: Optional[str] = None


class BookingCreate(BookingBase):
    pass


class BookingUpdate(BaseModel):
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    rental_price: Optional[Decimal] = None
    deposit_amount: Optional[Decimal] = None
    deposit_status: Optional[str] = None
    booking_status: Optional[str] = None
    notes: Optional[str] = None


class BookingResponse(BaseModel):
    id: int
    client_id: int
    dress_id: int
    start_date: date
    end_date: date
    rental_price: Decimal
    deposit_amount: Decimal
    deposit_status: str
    booking_status: str
    notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime] = None
    client: Optional[ClientResponse] = None
    dress: Optional[DressResponse] = None

    class Config:
        from_attributes = True


class BookingListResponse(BaseModel):
    bookings: List[BookingResponse]
    total: int


class CalendarBooking(BaseModel):
    id: int
    title: str
    start: str
    end: str
    color: str
    status: str
    client_name: str
    dress_name: str

