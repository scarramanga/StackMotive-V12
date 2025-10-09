"""add tier preview fields

Revision ID: 20251009_tier_preview
Revises: 54e702e0994b
Create Date: 2025-10-09 04:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '20251009_tier_preview'
down_revision = '54e702e0994b'
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('preview_tier', sa.String(), nullable=True))
    op.add_column('users', sa.Column('preview_expires_at', sa.DateTime(timezone=True), nullable=True))

def downgrade():
    op.drop_column('users', 'preview_expires_at')
    op.drop_column('users', 'preview_tier')
