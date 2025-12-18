"""Add purchase_price to clothing

Revision ID: 003_add_purchase_price
Revises: 002_settings
Create Date: 2024-12-18

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_purchase_price'
down_revision = '002_settings'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('clothing', sa.Column('purchase_price', sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_column('clothing', 'purchase_price')

