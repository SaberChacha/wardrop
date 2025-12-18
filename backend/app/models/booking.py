from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    dress_id = Column(Integer, ForeignKey("dresses.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(Date, nullable=False, index=True)
    end_date = Column(Date, nullable=False, index=True)
    rental_price = Column(Numeric(10, 2), nullable=False)
    deposit_amount = Column(Numeric(10, 2), nullable=False)
    deposit_status = Column(String(50), default="pending")  # pending, paid, returned, forfeited
    booking_status = Column(String(50), default="confirmed")  # confirmed, in_progress, completed, cancelled
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    client = relationship("Client", back_populates="bookings")
    dress = relationship("Dress", back_populates="bookings")

