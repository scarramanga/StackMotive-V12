"""enhance_portfolio_sync_history

Revision ID: 81c5da509200
Revises: f97c6b7cbd84
Create Date: 2025-10-07 04:49:28.872974

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '81c5da509200'
down_revision: Union[str, None] = 'abc123def456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE portfolio_sync_history 
        ADD COLUMN IF NOT EXISTS importId UUID DEFAULT gen_random_uuid(),
        ADD COLUMN IF NOT EXISTS errorMessage TEXT
    """)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_sync_importId 
        ON portfolio_sync_history(importId)
    """)
    
    op.execute("""
        ALTER TABLE portfolio_positions 
        ADD COLUMN IF NOT EXISTS asOf TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    """)
    op.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolio_positions_unique
        ON portfolio_positions(userId, symbol, asOf)
    """)


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS idx_portfolio_sync_importId")
    op.execute("DROP INDEX IF EXISTS idx_portfolio_positions_unique")
    op.execute("ALTER TABLE portfolio_sync_history DROP COLUMN IF EXISTS importId, DROP COLUMN IF EXISTS errorMessage")
    op.execute("ALTER TABLE portfolio_positions DROP COLUMN IF EXISTS asOf")
