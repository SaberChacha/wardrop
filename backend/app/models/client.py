from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    whatsapp = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    bookings = relationship("Booking", back_populates="client", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="client", cascade="all, delete-orphan")
    notifications = relationship("NotificationLog", back_populates="client", cascade="all, delete-orphan")

