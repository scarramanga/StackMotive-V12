"""add portfolio position columns

Revision ID: f1e2d3c4b5a6
Revises: 81c5da509200
Create Date: 2025-10-09 21:24:19.000000

"""
from alembic import op
import sqlalchemy as sa


revision = 'f1e2d3c4b5a6'
down_revision = '81c5da509200'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE portfolio_positions 
        ADD COLUMN IF NOT EXISTS name TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS assetclass TEXT DEFAULT 'equity',
        ADD COLUMN IF NOT EXISTS account TEXT DEFAULT 'default'
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE portfolio_positions 
        DROP COLUMN IF EXISTS name,
        DROP COLUMN IF EXISTS assetclass,
        DROP COLUMN IF EXISTS account
    """)
