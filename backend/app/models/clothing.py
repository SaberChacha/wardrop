from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Clothing(Base):
    __tablename__ = "clothing"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False)  # e.g., "Dress", "Accessories", "Shoes"
    size = Column(String(50), nullable=False)
    color = Column(String(100), nullable=False)
    purchase_price = Column(Numeric(10, 2), nullable=True)  # Cost price for profit calculation
    sale_price = Column(Numeric(10, 2), nullable=False)
    stock_quantity = Column(Integer, default=0)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    images = relationship("ClothingImage", back_populates="clothing", cascade="all, delete-orphan")
    sales = relationship("Sale", back_populates="clothing", cascade="all, delete-orphan")


class ClothingImage(Base):
    __tablename__ = "clothing_images"

    id = Column(Integer, primary_key=True, index=True)
    clothing_id = Column(Integer, ForeignKey("clothing.id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)

    # Relationships
    clothing = relationship("Clothing", back_populates="images")

