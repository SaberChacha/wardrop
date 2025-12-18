"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Admins table
    op.create_table(
        'admins',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_admins_email'), 'admins', ['email'], unique=True)
    op.create_index(op.f('ix_admins_id'), 'admins', ['id'], unique=False)

    # Clients table
    op.create_table(
        'clients',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('whatsapp', sa.String(length=50), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clients_full_name'), 'clients', ['full_name'], unique=False)
    op.create_index(op.f('ix_clients_id'), 'clients', ['id'], unique=False)

    # Dresses table
    op.create_table(
        'dresses',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('size', sa.String(length=50), nullable=False),
        sa.Column('color', sa.String(length=100), nullable=False),
        sa.Column('rental_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('deposit_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dresses_id'), 'dresses', ['id'], unique=False)
    op.create_index(op.f('ix_dresses_name'), 'dresses', ['name'], unique=False)

    # Dress images table
    op.create_table(
        'dress_images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('dress_id', sa.Integer(), nullable=False),
        sa.Column('image_path', sa.String(length=500), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['dress_id'], ['dresses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_dress_images_id'), 'dress_images', ['id'], unique=False)

    # Clothing table
    op.create_table(
        'clothing',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=False),
        sa.Column('size', sa.String(length=50), nullable=False),
        sa.Column('color', sa.String(length=100), nullable=False),
        sa.Column('sale_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('stock_quantity', sa.Integer(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clothing_id'), 'clothing', ['id'], unique=False)
    op.create_index(op.f('ix_clothing_name'), 'clothing', ['name'], unique=False)

    # Clothing images table
    op.create_table(
        'clothing_images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('clothing_id', sa.Integer(), nullable=False),
        sa.Column('image_path', sa.String(length=500), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=True),
        sa.ForeignKeyConstraint(['clothing_id'], ['clothing.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_clothing_images_id'), 'clothing_images', ['id'], unique=False)

    # Bookings table
    op.create_table(
        'bookings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('dress_id', sa.Integer(), nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('rental_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('deposit_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('deposit_status', sa.String(length=50), nullable=True),
        sa.Column('booking_status', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dress_id'], ['dresses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_bookings_end_date'), 'bookings', ['end_date'], unique=False)
    op.create_index(op.f('ix_bookings_id'), 'bookings', ['id'], unique=False)
    op.create_index(op.f('ix_bookings_start_date'), 'bookings', ['start_date'], unique=False)

    # Sales table
    op.create_table(
        'sales',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('clothing_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('total_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('sale_date', sa.Date(), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['clothing_id'], ['clothing.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sales_id'), 'sales', ['id'], unique=False)
    op.create_index(op.f('ix_sales_sale_date'), 'sales', ['sale_date'], unique=False)

    # Notification logs table
    op.create_table(
        'notification_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('client_id', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(length=100), nullable=False),
        sa.Column('channel', sa.String(length=50), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['client_id'], ['clients.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notification_logs_id'), 'notification_logs', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_notification_logs_id'), table_name='notification_logs')
    op.drop_table('notification_logs')
    op.drop_index(op.f('ix_sales_sale_date'), table_name='sales')
    op.drop_index(op.f('ix_sales_id'), table_name='sales')
    op.drop_table('sales')
    op.drop_index(op.f('ix_bookings_start_date'), table_name='bookings')
    op.drop_index(op.f('ix_bookings_id'), table_name='bookings')
    op.drop_index(op.f('ix_bookings_end_date'), table_name='bookings')
    op.drop_table('bookings')
    op.drop_index(op.f('ix_clothing_images_id'), table_name='clothing_images')
    op.drop_table('clothing_images')
    op.drop_index(op.f('ix_clothing_name'), table_name='clothing')
    op.drop_index(op.f('ix_clothing_id'), table_name='clothing')
    op.drop_table('clothing')
    op.drop_index(op.f('ix_dress_images_id'), table_name='dress_images')
    op.drop_table('dress_images')
    op.drop_index(op.f('ix_dresses_name'), table_name='dresses')
    op.drop_index(op.f('ix_dresses_id'), table_name='dresses')
    op.drop_table('dresses')
    op.drop_index(op.f('ix_clients_id'), table_name='clients')
    op.drop_index(op.f('ix_clients_full_name'), table_name='clients')
    op.drop_table('clients')
    op.drop_index(op.f('ix_admins_id'), table_name='admins')
    op.drop_index(op.f('ix_admins_email'), table_name='admins')
    op.drop_table('admins')

