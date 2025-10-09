"""add magic link tokens

Revision ID: 20251009_magic_links
Revises: 20251009_tier_preview
Create Date: 2025-10-09 04:30:30.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '20251009_magic_links'
down_revision = '20251009_tier_preview'
branch_labels = None
depends_on = None

def upgrade():
    op.create_table('magic_link_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('token', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.Column('used', sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_magic_link_tokens_email'), 'magic_link_tokens', ['email'], unique=False)
    op.create_index(op.f('ix_magic_link_tokens_token'), 'magic_link_tokens', ['token'], unique=True)

def downgrade():
    op.drop_index(op.f('ix_magic_link_tokens_token'), table_name='magic_link_tokens')
    op.drop_index(op.f('ix_magic_link_tokens_email'), table_name='magic_link_tokens')
    op.drop_table('magic_link_tokens')
