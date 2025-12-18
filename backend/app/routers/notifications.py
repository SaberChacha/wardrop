from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from ..services.notification import NotificationService
from ..models.booking import Booking
from ..models.client import Client
from .auth import get_current_user

router = APIRouter()


@router.post("/send")
async def send_notification(
    client_id: int,
    message: str,
    channel: str = Query("whatsapp", regex="^(sms|whatsapp)$"),
    notification_type: str = "general",
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send a custom notification to a client"""
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    service = NotificationService(db)
    
    if channel == "sms":
        if not client.phone:
            raise HTTPException(status_code=400, detail="Client has no phone number")
        result = service.send_sms(client_id, client.phone, message, notification_type)
    else:
        if not client.whatsapp:
            raise HTTPException(status_code=400, detail="Client has no WhatsApp number")
        result = service.send_whatsapp(client_id, client.whatsapp, message, notification_type)
    
    return result


@router.post("/booking/{booking_id}/confirmation")
async def send_booking_confirmation(
    booking_id: int,
    channel: str = Query("whatsapp", regex="^(sms|whatsapp)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send booking confirmation notification"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    service = NotificationService(db)
    result = service.send_booking_confirmation(
        client_id=booking.client_id,
        dress_name=booking.dress.name,
        start_date=booking.start_date.strftime("%d/%m/%Y"),
        end_date=booking.end_date.strftime("%d/%m/%Y"),
        channel=channel
    )
    
    return result


@router.post("/booking/{booking_id}/reminder")
async def send_return_reminder(
    booking_id: int,
    channel: str = Query("whatsapp", regex="^(sms|whatsapp)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send return reminder notification"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    service = NotificationService(db)
    result = service.send_return_reminder(
        client_id=booking.client_id,
        dress_name=booking.dress.name,
        return_date=booking.end_date.strftime("%d/%m/%Y"),
        channel=channel
    )
    
    return result


@router.post("/booking/{booking_id}/thank-you")
async def send_thank_you(
    booking_id: int,
    channel: str = Query("whatsapp", regex="^(sms|whatsapp)$"),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Send thank you message after rental completion"""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    service = NotificationService(db)
    result = service.send_thank_you(
        client_id=booking.client_id,
        channel=channel
    )
    
    return result


@router.get("/logs")
async def get_notification_logs(
    client_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get notification logs"""
    from ..models.notification import NotificationLog
    
    query = db.query(NotificationLog)
    
    if client_id:
        query = query.filter(NotificationLog.client_id == client_id)
    
    total = query.count()
    logs = query.order_by(NotificationLog.sent_at.desc()).offset(skip).limit(limit).all()
    
    return {"logs": logs, "total": total}

