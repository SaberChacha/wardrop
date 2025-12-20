"""Add updated_at column to all tables

Revision ID: 004
Revises: 003
Create Date: 2025-12-20

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


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

