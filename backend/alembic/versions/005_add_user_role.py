"""Add role column to admins table

Revision ID: 005
Revises: 004
Create Date: 2025-01-09

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create the enum type first
    role_enum = sa.Enum('admin', 'staff', name='userrole')
    role_enum.create(op.get_bind(), checkfirst=True)
    
    # Add role column with default 'admin' for existing users
    op.add_column('admins', sa.Column('role', sa.Enum('admin', 'staff', name='userrole'), 
                                       nullable=True))
    
    # Set existing users to admin role
    op.execute("UPDATE admins SET role = 'admin' WHERE role IS NULL")
    
    # Make column non-nullable after setting defaults
    op.alter_column('admins', 'role', nullable=False)


def downgrade() -> None:
    op.drop_column('admins', 'role')
    
    # Drop the enum type
    role_enum = sa.Enum('admin', 'staff', name='userrole')
    role_enum.drop(op.get_bind(), checkfirst=True)

