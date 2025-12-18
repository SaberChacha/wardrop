from twilio.rest import Client as TwilioClient
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime

from ..config import get_settings
from ..models.notification import NotificationLog
from ..models.client import Client as ClientModel

settings = get_settings()


class NotificationService:
    def __init__(self, db: Session):
        self.db = db
        self.twilio_client = None
        
        if settings.twilio_account_sid and settings.twilio_auth_token:
            self.twilio_client = TwilioClient(
                settings.twilio_account_sid,
                settings.twilio_auth_token
            )

    def _log_notification(
        self,
        client_id: int,
        notification_type: str,
        channel: str,
        message: str,
        status: str
    ) -> NotificationLog:
        log = NotificationLog(
            client_id=client_id,
            type=notification_type,
            channel=channel,
            message=message,
            status=status
        )
        self.db.add(log)
        self.db.commit()
        return log

    def send_sms(
        self,
        client_id: int,
        phone_number: str,
        message: str,
        notification_type: str = "general"
    ) -> dict:
        """Send SMS to a client"""
        if not self.twilio_client:
            return {"success": False, "error": "Twilio not configured"}
        
        try:
            sms = self.twilio_client.messages.create(
                body=message,
                from_=settings.twilio_phone_number,
                to=phone_number
            )
            
            self._log_notification(
                client_id=client_id,
                notification_type=notification_type,
                channel="sms",
                message=message,
                status="sent"
            )
            
            return {"success": True, "sid": sms.sid}
        except Exception as e:
            self._log_notification(
                client_id=client_id,
                notification_type=notification_type,
                channel="sms",
                message=message,
                status="failed"
            )
            return {"success": False, "error": str(e)}

    def send_whatsapp(
        self,
        client_id: int,
        whatsapp_number: str,
        message: str,
        notification_type: str = "general"
    ) -> dict:
        """Send WhatsApp message to a client"""
        if not self.twilio_client:
            return {"success": False, "error": "Twilio not configured"}
        
        try:
            # WhatsApp numbers need 'whatsapp:' prefix
            to_number = whatsapp_number if whatsapp_number.startswith("whatsapp:") else f"whatsapp:{whatsapp_number}"
            from_number = settings.twilio_whatsapp_number if settings.twilio_whatsapp_number.startswith("whatsapp:") else f"whatsapp:{settings.twilio_whatsapp_number}"
            
            msg = self.twilio_client.messages.create(
                body=message,
                from_=from_number,
                to=to_number
            )
            
            self._log_notification(
                client_id=client_id,
                notification_type=notification_type,
                channel="whatsapp",
                message=message,
                status="sent"
            )
            
            return {"success": True, "sid": msg.sid}
        except Exception as e:
            self._log_notification(
                client_id=client_id,
                notification_type=notification_type,
                channel="whatsapp",
                message=message,
                status="failed"
            )
            return {"success": False, "error": str(e)}

    def send_booking_confirmation(
        self,
        client_id: int,
        dress_name: str,
        start_date: str,
        end_date: str,
        channel: str = "whatsapp"
    ) -> dict:
        """Send booking confirmation notification"""
        client = self.db.query(ClientModel).filter(ClientModel.id == client_id).first()
        if not client:
            return {"success": False, "error": "Client not found"}
        
        message = f"Bonjour {client.full_name}!\n\nVotre réservation a été confirmée:\n- Robe: {dress_name}\n- Date: {start_date} au {end_date}\n\nMerci de nous faire confiance!\n\n🌸 Wardrop"
        
        if channel == "sms" and client.phone:
            return self.send_sms(client_id, client.phone, message, "booking_confirmation")
        elif channel == "whatsapp" and client.whatsapp:
            return self.send_whatsapp(client_id, client.whatsapp, message, "booking_confirmation")
        
        return {"success": False, "error": f"No {channel} number for client"}

    def send_return_reminder(
        self,
        client_id: int,
        dress_name: str,
        return_date: str,
        channel: str = "whatsapp"
    ) -> dict:
        """Send reminder for upcoming dress return"""
        client = self.db.query(ClientModel).filter(ClientModel.id == client_id).first()
        if not client:
            return {"success": False, "error": "Client not found"}
        
        message = f"Bonjour {client.full_name}!\n\nRappel: La robe '{dress_name}' doit être retournée le {return_date}.\n\nMerci!\n\n🌸 Wardrop"
        
        if channel == "sms" and client.phone:
            return self.send_sms(client_id, client.phone, message, "return_reminder")
        elif channel == "whatsapp" and client.whatsapp:
            return self.send_whatsapp(client_id, client.whatsapp, message, "return_reminder")
        
        return {"success": False, "error": f"No {channel} number for client"}

    def send_thank_you(
        self,
        client_id: int,
        channel: str = "whatsapp"
    ) -> dict:
        """Send thank you message after rental completion"""
        client = self.db.query(ClientModel).filter(ClientModel.id == client_id).first()
        if not client:
            return {"success": False, "error": "Client not found"}
        
        message = f"Bonjour {client.full_name}!\n\nMerci d'avoir choisi Wardrop! Nous espérons que vous avez passé un moment magnifique.\n\nÀ bientôt!\n\n🌸 Wardrop"
        
        if channel == "sms" and client.phone:
            return self.send_sms(client_id, client.phone, message, "thank_you")
        elif channel == "whatsapp" and client.whatsapp:
            return self.send_whatsapp(client_id, client.whatsapp, message, "thank_you")
        
        return {"success": False, "error": f"No {channel} number for client"}

