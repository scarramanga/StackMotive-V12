"""add_import_digests_table

Revision ID: 1e787d37dd38
Revises: f97c6b7cbd84
Create Date: 2025-10-07 04:15:42.564885

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1e787d37dd38'
down_revision: Union[str, None] = 'f97c6b7cbd84'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS import_digests (
            id SERIAL PRIMARY KEY,
            userId INTEGER NOT NULL,
            source TEXT NOT NULL,
            digest TEXT NOT NULL,
            importedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            metadata JSONB,
            UNIQUE(source, digest)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_import_digests_source ON import_digests(source)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_import_digests_userId ON import_digests(userId)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS import_digests")
