"""add_ibkr_import_history_table

Revision ID: e0995fdfd2e5
Revises: 1e787d37dd38
Create Date: 2025-10-07 04:16:21.428625

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e0995fdfd2e5'
down_revision: Union[str, None] = '1e787d37dd38'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS ibkr_import_history (
            id SERIAL PRIMARY KEY,
            importId UUID DEFAULT gen_random_uuid(),
            userId INTEGER NOT NULL,
            accountId TEXT NOT NULL,
            positionsImported INTEGER DEFAULT 0,
            importedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT NOT NULL,
            asOf TIMESTAMP,
            UNIQUE(importId)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_ibkr_import_userId ON ibkr_import_history(userId)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ibkr_import_history")
