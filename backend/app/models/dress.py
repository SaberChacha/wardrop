from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Dress(Base):
    __tablename__ = "dresses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # e.g., "Wedding", "Evening", "Engagement"
    size = Column(String(50), nullable=False)
    color = Column(String(100), nullable=False)
    rental_price = Column(Numeric(10, 2), nullable=False)
    deposit_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(50), default="available")  # available, rented, maintenance
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    images = relationship("DressImage", back_populates="dress", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="dress", cascade="all, delete-orphan")


class DressImage(Base):
    __tablename__ = "dress_images"

    id = Column(Integer, primary_key=True, index=True)
    dress_id = Column(Integer, ForeignKey("dresses.id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)

    # Relationships
    dress = relationship("Dress", back_populates="images")

