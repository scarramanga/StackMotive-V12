"""add username to users and basic indexes

Revision ID: 20251009abcd
Revises: f97c6b7cbd84, 5e54c7d1e999
Create Date: 2025-10-09

"""
from alembic import op
import sqlalchemy as sa

revision = '20251009abcd'
down_revision = ('f97c6b7cbd84', '5e54c7d1e999')
branch_labels = None
depends_on = None

def upgrade():
    op.add_column('users', sa.Column('username', sa.String(length=64), nullable=True))
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    op.create_index('ix_users_username', 'users', ['username'], unique=False)

def downgrade():
    op.drop_index('ix_users_username', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    op.drop_column('users', 'username')
