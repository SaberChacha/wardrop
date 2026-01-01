from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy.orm import Session
from datetime import date
import logging

from ..database import SessionLocal
from ..models.booking import Booking
from ..models.dress import Dress

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


def update_booking_statuses():
    """
    Update booking statuses based on dates:
    - confirmed -> in_progress when start_date <= today
    - in_progress -> completed when end_date < today
    Also updates dress status accordingly
    """
    db: Session = SessionLocal()
    try:
        today = date.today()
        logger.info(f"Running booking status update for {today}")
        
        # Update confirmed bookings to in_progress when start_date arrives
        confirmed_bookings = db.query(Booking).filter(
            Booking.booking_status == "confirmed",
            Booking.start_date <= today
        ).all()
        
        for booking in confirmed_bookings:
            booking.booking_status = "in_progress"
            # Update dress status to rented
            dress = db.query(Dress).filter(Dress.id == booking.dress_id).first()
            if dress:
                dress.status = "rented"
            logger.info(f"Booking {booking.id} changed to in_progress")
        
        # Update in_progress bookings to completed when end_date passes
        in_progress_bookings = db.query(Booking).filter(
            Booking.booking_status == "in_progress",
            Booking.end_date < today
        ).all()
        
        for booking in in_progress_bookings:
            booking.booking_status = "completed"
            
            # Check if dress has other active bookings
            dress = db.query(Dress).filter(Dress.id == booking.dress_id).first()
            if dress:
                # Check for other active bookings on this dress
                other_active = db.query(Booking).filter(
                    Booking.dress_id == booking.dress_id,
                    Booking.id != booking.id,
                    Booking.booking_status.in_(["confirmed", "in_progress"]),
                    Booking.start_date <= today,
                    Booking.end_date >= today
                ).count()
                
                if other_active == 0:
                    dress.status = "available"
            logger.info(f"Booking {booking.id} changed to completed")
        
        db.commit()
        logger.info(f"Booking status update complete. Updated {len(confirmed_bookings)} to in_progress, {len(in_progress_bookings)} to completed")
        
    except Exception as e:
        logger.error(f"Error updating booking statuses: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """Start the scheduler with configured jobs"""
    # Run booking status update every day at midnight
    scheduler.add_job(
        update_booking_statuses,
        CronTrigger(hour=0, minute=0),
        id="update_booking_statuses",
        replace_existing=True
    )
    
    # Also run immediately on startup to catch any missed updates
    scheduler.add_job(
        update_booking_statuses,
        'date',  # Run once immediately
        id="update_booking_statuses_startup"
    )
    
    scheduler.start()
    logger.info("Scheduler started")


def stop_scheduler():
    """Stop the scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")






