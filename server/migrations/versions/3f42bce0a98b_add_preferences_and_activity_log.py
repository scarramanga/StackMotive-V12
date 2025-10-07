"""add preferences and activity log tables

Revision ID: 3f42bce0a98b
Revises: 2b16a8ea0a5b
Create Date: 2025-10-07 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '3f42bce0a98b'
down_revision = '2b16a8ea0a5b'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'user_preferences',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('data', sa.Text(), nullable=False),
        sa.Column('version', sa.Integer(), nullable=True, server_default='1'),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    op.create_index('user_preferences_user_id_idx', 'user_preferences', ['user_id'])
    
    op.create_table(
        'user_activity_log',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('payload_hash', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('user_activity_log_user_id_created_at_idx', 'user_activity_log', ['user_id', 'created_at'])


def downgrade():
    op.drop_index('user_activity_log_user_id_created_at_idx', table_name='user_activity_log')
    op.drop_table('user_activity_log')
    
    op.drop_index('user_preferences_user_id_idx', table_name='user_preferences')
    op.drop_table('user_preferences')
