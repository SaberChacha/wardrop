"""Add settings table

Revision ID: 002_settings
Revises: 001_initial
Create Date: 2024-12-18

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_settings'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('language', sa.String(length=10), nullable=True, server_default='fr'),
        sa.Column('brand_name', sa.String(length=255), nullable=True, server_default='Wardrop'),
        sa.Column('logo_path', sa.String(length=500), nullable=True),
        sa.Column('currency', sa.String(length=10), nullable=True, server_default='DZD'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_settings_id'), 'settings', ['id'], unique=False)
    
    # Insert default settings
    op.execute("""
        INSERT INTO settings (language, brand_name, currency) 
        VALUES ('fr', 'Wardrop', 'DZD')
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_settings_id'), table_name='settings')
    op.drop_table('settings')

