"""Add updated_at column to all tables

Revision ID: 004_add_updated_at
Revises: 003_add_purchase_price
Create Date: 2025-12-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '004_add_updated_at'
down_revision: Union[str, None] = '003_add_purchase_price'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add updated_at column to clients table
    op.add_column('clients', sa.Column('updated_at', sa.DateTime(timezone=True), 
                                        server_default=sa.func.now(), nullable=True))
    
    # Add updated_at column to dresses table
    op.add_column('dresses', sa.Column('updated_at', sa.DateTime(timezone=True), 
                                        server_default=sa.func.now(), nullable=True))
    
    # Add updated_at column to clothing table
    op.add_column('clothing', sa.Column('updated_at', sa.DateTime(timezone=True), 
                                         server_default=sa.func.now(), nullable=True))
    
    # Add updated_at column to bookings table
    op.add_column('bookings', sa.Column('updated_at', sa.DateTime(timezone=True), 
                                         server_default=sa.func.now(), nullable=True))
    
    # Add updated_at column to sales table
    op.add_column('sales', sa.Column('updated_at', sa.DateTime(timezone=True), 
                                      server_default=sa.func.now(), nullable=True))


def downgrade() -> None:
    op.drop_column('sales', 'updated_at')
    op.drop_column('bookings', 'updated_at')
    op.drop_column('clothing', 'updated_at')
    op.drop_column('dresses', 'updated_at')
    op.drop_column('clients', 'updated_at')

