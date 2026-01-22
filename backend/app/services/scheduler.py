from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime, timedelta
import logging

from ..database import SessionLocal
from ..models.booking import Booking
from ..models.dress import Dress
from ..models.settings import Settings
from ..models.notification import NotificationLog
from ..models.client import Client
from ..models.product import Product
from ..config import get_settings

logger = logging.getLogger(__name__)
config = get_settings()

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


def send_booking_reminders():
    """
    Send SMS reminders for upcoming bookings based on settings.
    Checks for bookings starting within the configured reminder window
    and sends SMS to clients who haven't received a reminder yet.
    """
    db: Session = SessionLocal()
    try:
        # Check if Twilio is configured
        if not config.twilio_account_sid or not config.twilio_auth_token or not config.twilio_phone_number:
            logger.debug("Twilio not configured, skipping SMS reminders")
            return
        
        # Get settings
        settings = db.query(Settings).first()
        if not settings or not settings.sms_reminders_enabled:
            logger.debug("SMS reminders disabled, skipping")
            return
        
        reminder_hours = settings.sms_reminder_hours or 24
        custom_message = settings.sms_reminder_message
        
        now = datetime.now()
        reminder_window_start = now
        reminder_window_end = now + timedelta(hours=reminder_hours)
        
        logger.info(f"Checking for bookings between {reminder_window_start} and {reminder_window_end}")
        
        # Find confirmed bookings starting within the reminder window
        # that haven't received a reminder yet
        upcoming_bookings = db.query(Booking).options(
            joinedload(Booking.client),
            joinedload(Booking.product),
            joinedload(Booking.dress)
        ).filter(
            Booking.booking_status == "confirmed",
            Booking.start_date >= reminder_window_start.date(),
            Booking.start_date <= reminder_window_end.date()
        ).all()
        
        for booking in upcoming_bookings:
            # Check if reminder already sent for this booking
            existing_reminder = db.query(NotificationLog).filter(
                NotificationLog.booking_id == booking.id,
                NotificationLog.type == "booking_reminder",
                NotificationLog.status == "sent"
            ).first()
            
            if existing_reminder:
                logger.debug(f"Reminder already sent for booking {booking.id}")
                continue
            
            client = booking.client
            if not client or not client.phone:
                logger.debug(f"No phone number for client in booking {booking.id}")
                continue
            
            # Get product/dress name
            product_name = "votre article"
            if booking.product:
                product_name = booking.product.name
            elif booking.dress:
                product_name = booking.dress.name
            
            # Build message
            if custom_message:
                # Replace placeholders in custom message
                message = custom_message.replace("{client_name}", client.full_name)
                message = message.replace("{product_name}", product_name)
                message = message.replace("{start_date}", booking.start_date.strftime("%d/%m/%Y"))
            else:
                # Default message
                message = f"Bonjour {client.full_name}!\n\nRappel: Votre réservation pour '{product_name}' est prévue pour le {booking.start_date.strftime('%d/%m/%Y')}.\n\nÀ bientôt!\n\n🌸 Wardrop"
            
            # Send SMS
            try:
                from twilio.rest import Client as TwilioClient
                twilio_client = TwilioClient(config.twilio_account_sid, config.twilio_auth_token)
                
                sms = twilio_client.messages.create(
                    body=message,
                    from_=config.twilio_phone_number,
                    to=client.phone
                )
                
                # Log successful notification
                notification_log = NotificationLog(
                    client_id=client.id,
                    booking_id=booking.id,
                    type="booking_reminder",
                    channel="sms",
                    message=message,
                    status="sent"
                )
                db.add(notification_log)
                logger.info(f"SMS reminder sent for booking {booking.id} to {client.phone}, SID: {sms.sid}")
                
            except Exception as sms_error:
                # Log failed notification
                notification_log = NotificationLog(
                    client_id=client.id,
                    booking_id=booking.id,
                    type="booking_reminder",
                    channel="sms",
                    message=message,
                    status="failed"
                )
                db.add(notification_log)
                logger.error(f"Failed to send SMS for booking {booking.id}: {sms_error}")
        
        db.commit()
        logger.info("Booking reminder check complete")
        
    except Exception as e:
        logger.error(f"Error sending booking reminders: {e}")
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
    
    # Run SMS reminder check every hour
    scheduler.add_job(
        send_booking_reminders,
        IntervalTrigger(hours=1),
        id="send_booking_reminders",
        replace_existing=True
    )
    
    # Also run reminders check on startup
    scheduler.add_job(
        send_booking_reminders,
        'date',  # Run once immediately
        id="send_booking_reminders_startup"
    )
    
    scheduler.start()
    logger.info("Scheduler started")


def stop_scheduler():
    """Stop the scheduler"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")








