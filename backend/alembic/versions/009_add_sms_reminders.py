"""Add SMS reminder settings

Revision ID: 009
Revises: 008
Create Date: 2026-01-22

This migration adds SMS reminder settings columns to the settings table
and booking_id to notification_logs for tracking reminders.
"""
from alembic import op
import sqlalchemy as sa

revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add SMS reminder settings
    op.add_column('settings', sa.Column('sms_reminders_enabled', sa.Boolean(), nullable=True, server_default='false'))
    op.add_column('settings', sa.Column('sms_reminder_hours', sa.Integer(), nullable=True, server_default='24'))
    op.add_column('settings', sa.Column('sms_reminder_message', sa.Text(), nullable=True))
    
    # Add booking_id to notification_logs for tracking booking reminders
    op.add_column('notification_logs', sa.Column('booking_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_notification_logs_booking_id',
        'notification_logs', 'bookings',
        ['booking_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    op.drop_constraint('fk_notification_logs_booking_id', 'notification_logs', type_='foreignkey')
    op.drop_column('notification_logs', 'booking_id')
    op.drop_column('settings', 'sms_reminder_message')
    op.drop_column('settings', 'sms_reminder_hours')
    op.drop_column('settings', 'sms_reminders_enabled')
