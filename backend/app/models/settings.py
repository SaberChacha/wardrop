from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from ..database import Base


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    language = Column(String(10), default="fr")  # 'fr' or 'ar'
    brand_name = Column(String(255), default="Wardrop")
    logo_path = Column(String(500), nullable=True)
    currency = Column(String(10), default="DZD")
    
    # SMS Reminder Settings
    sms_reminders_enabled = Column(Boolean, default=False)
    sms_reminder_hours = Column(Integer, default=24)  # Hours before reservation to send reminder
    sms_reminder_message = Column(Text, nullable=True)  # Custom message template
    
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())








