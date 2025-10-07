"""create_portfolio_base_tables

Revision ID: abc123def456
Revises: f97c6b7cbd84
Create Date: 2025-10-07 05:02:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'abc123def456'
down_revision: Union[str, None] = 'f97c6b7cbd84'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS portfolio_positions (
            id SERIAL PRIMARY KEY,
            userId INTEGER NOT NULL,
            symbol TEXT NOT NULL,
            quantity NUMERIC NOT NULL,
            avgCost NUMERIC,
            currentPrice NUMERIC,
            lastUpdated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            source TEXT DEFAULT 'manual'
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_portfolio_positions_userId ON portfolio_positions(userId)")
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS portfolio_sync_history (
            id SERIAL PRIMARY KEY,
            userId INTEGER NOT NULL,
            syncType TEXT NOT NULL,
            status TEXT NOT NULL,
            itemsImported INTEGER DEFAULT 0,
            syncedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_portfolio_sync_userId ON portfolio_sync_history(userId)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS portfolio_sync_history")
    op.execute("DROP TABLE IF EXISTS portfolio_positions")
