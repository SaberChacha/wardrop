"""Unified Product System - Merge Dress and Clothing

Revision ID: 006
Revises: 005
Create Date: 2024-01-09

This migration:
1. Creates Category and Size lookup tables
2. Creates unified Product and ProductImage tables
3. Migrates existing Dress/Clothing data (COPY, not move)
4. Adds product_id to Booking and Sale tables
5. Preserves all original tables for safety
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create producttype enum
    producttype_enum = postgresql.ENUM('rent', 'sale', name='producttype')
    producttype_enum.create(op.get_bind(), checkfirst=True)
    
    # 2. Create categories table
    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('is_for_sale', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_name'), 'categories', ['name'], unique=False)
    
    # 3. Create sizes table
    op.create_table(
        'sizes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=50), nullable=False),
        sa.Column('is_for_sale', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_sizes_id'), 'sizes', ['id'], unique=False)
    op.create_index(op.f('ix_sizes_name'), 'sizes', ['name'], unique=False)
    
    # 4. Create products table
    op.create_table(
        'products',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('type', producttype_enum, nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=True),
        sa.Column('size_id', sa.Integer(), nullable=True),
        sa.Column('color', sa.String(length=100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('status', sa.String(length=50), default='available'),
        sa.Column('rental_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('deposit_amount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('purchase_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('sale_price', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('stock_quantity', sa.Integer(), nullable=True),
        sa.Column('original_dress_id', sa.Integer(), nullable=True),
        sa.Column('original_clothing_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['category_id'], ['categories.id']),
        sa.ForeignKeyConstraint(['size_id'], ['sizes.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_products_id'), 'products', ['id'], unique=False)
    op.create_index(op.f('ix_products_name'), 'products', ['name'], unique=False)
    op.create_index(op.f('ix_products_type'), 'products', ['type'], unique=False)
    
    # 5. Create product_images table
    op.create_table(
        'product_images',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('image_path', sa.String(length=500), nullable=False),
        sa.Column('is_primary', sa.Boolean(), default=False),
        sa.Column('original_dress_image_id', sa.Integer(), nullable=True),
        sa.Column('original_clothing_image_id', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_product_images_id'), 'product_images', ['id'], unique=False)
    
    # 6. Migrate categories from dresses (is_for_sale = false)
    op.execute("""
        INSERT INTO categories (name, is_for_sale)
        SELECT DISTINCT category, false
        FROM dresses
        WHERE category IS NOT NULL AND category != ''
        ON CONFLICT DO NOTHING
    """)
    
    # 7. Migrate categories from clothing (is_for_sale = true)
    op.execute("""
        INSERT INTO categories (name, is_for_sale)
        SELECT DISTINCT category, true
        FROM clothing
        WHERE category IS NOT NULL AND category != ''
        ON CONFLICT DO NOTHING
    """)
    
    # 8. Migrate sizes from dresses (is_for_sale = false)
    op.execute("""
        INSERT INTO sizes (name, is_for_sale)
        SELECT DISTINCT size, false
        FROM dresses
        WHERE size IS NOT NULL AND size != ''
        ON CONFLICT DO NOTHING
    """)
    
    # 9. Migrate sizes from clothing (is_for_sale = true)
    op.execute("""
        INSERT INTO sizes (name, is_for_sale)
        SELECT DISTINCT size, true
        FROM clothing
        WHERE size IS NOT NULL AND size != ''
        ON CONFLICT DO NOTHING
    """)
    
    # 10. Copy dresses to products (type = 'rent')
    op.execute("""
        INSERT INTO products (
            name, type, category_id, size_id, color, description, status,
            rental_price, deposit_amount, original_dress_id, created_at, updated_at
        )
        SELECT 
            d.name,
            'rent',
            c.id,
            s.id,
            d.color,
            d.description,
            d.status,
            d.rental_price,
            d.deposit_amount,
            d.id,
            d.created_at,
            d.updated_at
        FROM dresses d
        LEFT JOIN categories c ON c.name = d.category AND c.is_for_sale = false
        LEFT JOIN sizes s ON s.name = d.size AND s.is_for_sale = false
    """)
    
    # 11. Copy clothing to products (type = 'sale')
    op.execute("""
        INSERT INTO products (
            name, type, category_id, size_id, color, description, status,
            purchase_price, sale_price, stock_quantity, original_clothing_id, created_at, updated_at
        )
        SELECT 
            cl.name,
            'sale',
            c.id,
            s.id,
            cl.color,
            cl.description,
            CASE WHEN cl.stock_quantity > 0 THEN 'available' ELSE 'sold_out' END,
            cl.purchase_price,
            cl.sale_price,
            cl.stock_quantity,
            cl.id,
            cl.created_at,
            cl.updated_at
        FROM clothing cl
        LEFT JOIN categories c ON c.name = cl.category AND c.is_for_sale = true
        LEFT JOIN sizes s ON s.name = cl.size AND s.is_for_sale = true
    """)
    
    # 12. Copy dress_images to product_images
    op.execute("""
        INSERT INTO product_images (product_id, image_path, is_primary, original_dress_image_id)
        SELECT 
            p.id,
            di.image_path,
            di.is_primary,
            di.id
        FROM dress_images di
        INNER JOIN products p ON p.original_dress_id = di.dress_id
    """)
    
    # 13. Copy clothing_images to product_images
    op.execute("""
        INSERT INTO product_images (product_id, image_path, is_primary, original_clothing_image_id)
        SELECT 
            p.id,
            ci.image_path,
            ci.is_primary,
            ci.id
        FROM clothing_images ci
        INNER JOIN products p ON p.original_clothing_id = ci.clothing_id
    """)
    
    # 14. Add product_id column to bookings table
    op.add_column('bookings', sa.Column('product_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_bookings_product_id', 'bookings', 'products', ['product_id'], ['id'])
    
    # 15. Populate product_id in bookings from dress_id
    op.execute("""
        UPDATE bookings b
        SET product_id = p.id
        FROM products p
        WHERE p.original_dress_id = b.dress_id
    """)
    
    # 16. Add product_id column to sales table
    op.add_column('sales', sa.Column('product_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_sales_product_id', 'sales', 'products', ['product_id'], ['id'])
    
    # 17. Populate product_id in sales from clothing_id
    op.execute("""
        UPDATE sales s
        SET product_id = p.id
        FROM products p
        WHERE p.original_clothing_id = s.clothing_id
    """)


def downgrade() -> None:
    # Remove product_id from sales
    op.drop_constraint('fk_sales_product_id', 'sales', type_='foreignkey')
    op.drop_column('sales', 'product_id')
    
    # Remove product_id from bookings
    op.drop_constraint('fk_bookings_product_id', 'bookings', type_='foreignkey')
    op.drop_column('bookings', 'product_id')
    
    # Drop product_images table
    op.drop_index(op.f('ix_product_images_id'), table_name='product_images')
    op.drop_table('product_images')
    
    # Drop products table
    op.drop_index(op.f('ix_products_type'), table_name='products')
    op.drop_index(op.f('ix_products_name'), table_name='products')
    op.drop_index(op.f('ix_products_id'), table_name='products')
    op.drop_table('products')
    
    # Drop sizes table
    op.drop_index(op.f('ix_sizes_name'), table_name='sizes')
    op.drop_index(op.f('ix_sizes_id'), table_name='sizes')
    op.drop_table('sizes')
    
    # Drop categories table
    op.drop_index(op.f('ix_categories_name'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
    
    # Drop producttype enum
    producttype_enum = postgresql.ENUM('rent', 'sale', name='producttype')
    producttype_enum.drop(op.get_bind(), checkfirst=True)
    
    # NOTE: Original tables (dresses, clothing, dress_images, clothing_images) 
    # are PRESERVED and untouched

