from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from ..database import Base


class Size(Base):
    __tablename__ = "sizes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False, index=True)
    is_for_sale = Column(Boolean, nullable=False, default=False)  # False = rental, True = sale
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Unique constraint on name + is_for_sale combination
    __table_args__ = (
        {'extend_existing': True}
    )

