"""add_cash_events_table

Revision ID: def789abc123
Revises: abc123def456
Create Date: 2025-10-07 18:51:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'def789abc123'
down_revision: Union[str, None] = 'abc123def456'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS cash_events (
            id SERIAL PRIMARY KEY,
            userId INTEGER NOT NULL,
            eventType TEXT NOT NULL CHECK (eventType IN ('deposit', 'withdrawal', 'interest', 'dividend')),
            amount NUMERIC NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            eventDate TIMESTAMP NOT NULL,
            source TEXT NOT NULL,
            accountId TEXT,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_cash_events_userId ON cash_events(userId)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_cash_events_eventDate ON cash_events(eventDate)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS cash_events")
