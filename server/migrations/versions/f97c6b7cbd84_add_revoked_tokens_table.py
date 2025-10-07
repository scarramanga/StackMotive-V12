"""add_revoked_tokens_table

Revision ID: f97c6b7cbd84
Revises: 8fb547391494
Create Date: 2025-10-07 02:11:15.197549

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f97c6b7cbd84'
down_revision: Union[str, None] = '8fb547391494'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'revoked_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('jti', sa.String(length=36), nullable=False),
        sa.Column('token_type', sa.String(length=20), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('revoked_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_revoked_tokens_jti'), 'revoked_tokens', ['jti'], unique=True)
    op.create_index(op.f('ix_revoked_tokens_user_id'), 'revoked_tokens', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_revoked_tokens_user_id'), table_name='revoked_tokens')
    op.drop_index(op.f('ix_revoked_tokens_jti'), table_name='revoked_tokens')
    op.drop_table('revoked_tokens')
