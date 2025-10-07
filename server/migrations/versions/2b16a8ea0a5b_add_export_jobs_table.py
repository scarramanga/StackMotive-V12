"""add_export_jobs_table

Revision ID: 2b16a8ea0a5b
Revises: def789abc123
Create Date: 2025-10-07 20:12:09.679955

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2b16a8ea0a5b'
down_revision: Union[str, None] = 'def789abc123'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'export_jobs',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('userId', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='queued'),
        sa.Column('format', sa.String(20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('finished_at', sa.DateTime(), nullable=True),
        sa.Column('artifact_path', sa.Text(), nullable=True),
        sa.Column('checksum', sa.String(64), nullable=True)
    )
    op.create_index('idx_export_jobs_userId', 'export_jobs', ['userId'])
    op.create_index('idx_export_jobs_created_at', 'export_jobs', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_export_jobs_created_at', table_name='export_jobs')
    op.drop_index('idx_export_jobs_userId', table_name='export_jobs')
    op.drop_table('export_jobs')
