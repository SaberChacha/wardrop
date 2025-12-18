from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, asc, desc
from typing import List, Optional, Literal
from datetime import date, datetime

from ..database import get_db
from ..models.booking import Booking
from ..models.dress import Dress
from ..schemas.booking import BookingCreate, BookingUpdate, BookingResponse, BookingListResponse, CalendarBooking
from .auth import get_current_user

router = APIRouter()


@router.get("/", response_model=BookingListResponse)
async def get_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    deposit_status: Optional[str] = None,
    client_id: Optional[int] = None,
    dress_id: Optional[int] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    sort_by: Optional[str] = Query("start_date", description="Field to sort by: start_date, rental_price, created_at"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("desc", description="Sort order"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all bookings with optional filters, sorting, and pagination"""
    query = db.query(Booking).options(
        joinedload(Booking.client),
        joinedload(Booking.dress)
    )
    
    if status:
        query = query.filter(Booking.booking_status == status)
    
    if deposit_status:
        query = query.filter(Booking.deposit_status == deposit_status)
    
    if client_id:
        query = query.filter(Booking.client_id == client_id)
    
    if dress_id:
        query = query.filter(Booking.dress_id == dress_id)
    
    if start_date:
        query = query.filter(Booking.start_date >= start_date)
    
    if end_date:
        query = query.filter(Booking.end_date <= end_date)
    
    total = query.count()
    
    # Apply sorting
    sort_column = getattr(Booking, sort_by, Booking.start_date)
    if sort_order == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))
    
    bookings = query.offset(skip).limit(limit).all()
    
    return {"bookings": bookings, "total": total}


@router.get("/calendar", response_model=List[CalendarBooking])
async def get_calendar_bookings(
    start: date,
    end: date,
    dress_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get bookings for calendar view within a date range"""
    query = db.query(Booking).options(
        joinedload(Booking.client),
        joinedload(Booking.dress)
    ).filter(
        and_(
            Booking.start_date <= end,
            Booking.end_date >= start,
            Booking.booking_status != "cancelled"
        )
    )
    
    if dress_id:
        query = query.filter(Booking.dress_id == dress_id)
    
    bookings = query.all()
    
    # Transform to calendar format
    calendar_events = []
    for booking in bookings:
        color = {
            "confirmed": "#10b981",  # green
            "in_progress": "#f59e0b",  # amber
            "completed": "#6366f1",  # indigo
        }.get(booking.booking_status, "#94a3b8")
        
        calendar_events.append({
            "id": booking.id,
            "title": f"{booking.dress.name} - {booking.client.full_name}",
            "start": booking.start_date.isoformat(),
            "end": booking.end_date.isoformat(),
            "color": color,
            "status": booking.booking_status,
            "client_name": booking.client.full_name,
            "dress_name": booking.dress.name
        })
    
    return calendar_events


@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get a specific booking by ID"""
    booking = db.query(Booking).options(
        joinedload(Booking.client),
        joinedload(Booking.dress)
    ).filter(Booking.id == booking_id).first()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.post("/", response_model=BookingResponse)
async def create_booking(
    booking: BookingCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new booking"""
    # Check if dress is available for the date range
    dress = db.query(Dress).filter(Dress.id == booking.dress_id).first()
    if not dress:
        raise HTTPException(status_code=404, detail="Dress not found")
    
    # Check for overlapping bookings
    overlapping = db.query(Booking).filter(
        and_(
            Booking.dress_id == booking.dress_id,
            Booking.booking_status != "cancelled",
            Booking.start_date <= booking.end_date,
            Booking.end_date >= booking.start_date
        )
    ).first()
    
    if overlapping:
        raise HTTPException(
            status_code=400,
            detail=f"Dress is already booked from {overlapping.start_date} to {overlapping.end_date}"
        )
    
    db_booking = Booking(
        client_id=booking.client_id,
        dress_id=booking.dress_id,
        start_date=booking.start_date,
        end_date=booking.end_date,
        rental_price=booking.rental_price or dress.rental_price,
        deposit_amount=booking.deposit_amount or dress.deposit_amount,
        deposit_status=booking.deposit_status or "pending",
        booking_status=booking.booking_status or "confirmed",
        notes=booking.notes
    )
    db.add(db_booking)
    
    # Update dress status if booking starts today or earlier
    if booking.start_date <= date.today():
        dress.status = "rented"
    
    db.commit()
    db.refresh(db_booking)
    
    # Reload with relationships
    return db.query(Booking).options(
        joinedload(Booking.client),
        joinedload(Booking.dress)
    ).filter(Booking.id == db_booking.id).first()


@router.put("/{booking_id}", response_model=BookingResponse)
async def update_booking(
    booking_id: int,
    booking: BookingUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update an existing booking"""
    db_booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not db_booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    update_data = booking.model_dump(exclude_unset=True)
    
    # If changing dates, check for conflicts
    if "start_date" in update_data or "end_date" in update_data:
        new_start = update_data.get("start_date", db_booking.start_date)
        new_end = update_data.get("end_date", db_booking.end_date)
        
        overlapping = db.query(Booking).filter(
            and_(
                Booking.dress_id == db_booking.dress_id,
                Booking.id != booking_id,
                Booking.booking_status != "cancelled",
                Booking.start_date <= new_end,
                Booking.end_date >= new_start
            )
        ).first()
        
        if overlapping:
            raise HTTPException(
                status_code=400,
                detail=f"Dress is already booked from {overlapping.start_date} to {overlapping.end_date}"
            )
    
    for field, value in update_data.items():
        setattr(db_booking, field, value)
    
    # Update dress status based on booking status
    dress = db.query(Dress).filter(Dress.id == db_booking.dress_id).first()
    if db_booking.booking_status == "completed" or db_booking.booking_status == "cancelled":
        # Check if there are other active bookings
        active_bookings = db.query(Booking).filter(
            and_(
                Booking.dress_id == db_booking.dress_id,
                Booking.id != booking_id,
                Booking.booking_status.in_(["confirmed", "in_progress"]),
                Booking.start_date <= date.today(),
                Booking.end_date >= date.today()
            )
        ).count()
        
        if active_bookings == 0:
            dress.status = "available"
    elif db_booking.booking_status == "in_progress":
        dress.status = "rented"
    
    db.commit()
    db.refresh(db_booking)
    
    return db.query(Booking).options(
        joinedload(Booking.client),
        joinedload(Booking.dress)
    ).filter(Booking.id == db_booking.id).first()


@router.delete("/{booking_id}")
async def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Delete a booking"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    db.delete(booking)
    db.commit()
    return {"message": "Booking deleted successfully"}

