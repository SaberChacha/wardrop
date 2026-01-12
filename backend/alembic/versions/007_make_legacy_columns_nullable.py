"""Make legacy dress_id and clothing_id columns nullable

Revision ID: 007
Revises: 006
Create Date: 2026-01-12

This migration makes the legacy foreign key columns nullable
so that new bookings/sales can use product_id instead.
"""
from alembic import op
import sqlalchemy as sa

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make dress_id nullable in bookings table
    op.alter_column('bookings', 'dress_id',
                    existing_type=sa.Integer(),
                    nullable=True)
    
    # Make clothing_id nullable in sales table
    op.alter_column('sales', 'clothing_id',
                    existing_type=sa.Integer(),
                    nullable=True)


def downgrade() -> None:
    # Note: This will fail if there are NULL values in these columns
    op.alter_column('sales', 'clothing_id',
                    existing_type=sa.Integer(),
                    nullable=False)
    
    op.alter_column('bookings', 'dress_id',
                    existing_type=sa.Integer(),
                    nullable=False)
