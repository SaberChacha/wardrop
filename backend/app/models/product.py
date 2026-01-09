from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class ProductType(enum.Enum):
    rent = "rent"
    sale = "sale"


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(Enum(ProductType), nullable=False, index=True)  # rent or sale
    
    # Foreign keys to lookup tables
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    size_id = Column(Integer, ForeignKey("sizes.id"), nullable=True)
    
    # Common fields
    color = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="available")  # available, rented, maintenance, sold_out
    
    # Rental-specific fields (nullable for sale products)
    rental_price = Column(Numeric(10, 2), nullable=True)
    deposit_amount = Column(Numeric(10, 2), nullable=True)
    
    # Sale-specific fields (nullable for rental products)
    purchase_price = Column(Numeric(10, 2), nullable=True)  # Cost price for profit calculation
    sale_price = Column(Numeric(10, 2), nullable=True)
    stock_quantity = Column(Integer, nullable=True, default=0)
    
    # Tracking original source for data safety
    original_dress_id = Column(Integer, nullable=True)  # Reference to original dress if migrated
    original_clothing_id = Column(Integer, nullable=True)  # Reference to original clothing if migrated
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan")
    category = relationship("Category", backref="products")
    size = relationship("Size", backref="products")


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    image_path = Column(String(500), nullable=False)
    is_primary = Column(Boolean, default=False)
    
    # Tracking original source
    original_dress_image_id = Column(Integer, nullable=True)
    original_clothing_image_id = Column(Integer, nullable=True)

    # Relationships
    product = relationship("Product", back_populates="images")

