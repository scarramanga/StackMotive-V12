"""add strategy column to trades table

Revision ID: 8fb547391494
Revises: 
Create Date: 2024-03-26

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8fb547391494'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(), nullable=True),
        sa.Column('hashed_password', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('is_admin', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('has_completed_onboarding', sa.Boolean(), nullable=True),
        sa.Column('onboarding_completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('onboarding_step', sa.Integer(), nullable=True),
        sa.Column('preferred_currency', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)

    # Create paper_trading_accounts table
    op.create_table(
        'paper_trading_accounts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('name', sa.String(), nullable=True),
        sa.Column('initial_balance', sa.Float(), nullable=True),
        sa.Column('current_balance', sa.Float(), nullable=True),
        sa.Column('currency', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('strategy_name', sa.String(), nullable=True),
        sa.Column('last_strategy_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_paper_trading_accounts_id'), 'paper_trading_accounts', ['id'], unique=False)

    # Create trades table
    op.create_table(
        'trades',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('paper_trading_account_id', sa.Integer(), nullable=True),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('trade_type', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('total_value', sa.Float(), nullable=False),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('strategy', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)')),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['paper_trading_account_id'], ['paper_trading_accounts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_trades_id'), 'trades', ['id'], unique=False)
    op.create_index(op.f('ix_trades_symbol'), 'trades', ['symbol'], unique=False)

    # Create tax_settings table
    op.create_table(
        'tax_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('tax_residency', sa.String(), nullable=True),
        sa.Column('accounting_method', sa.String(), nullable=True),
        sa.Column('include_fees', sa.Boolean(), nullable=True),
        sa.Column('include_foreign_income', sa.Boolean(), nullable=True),
        sa.Column('carry_forward_losses', sa.Boolean(), nullable=True),
        sa.Column('previous_year_losses', sa.Float(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # Create tax_transactions table
    op.create_table(
        'tax_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('transaction_type', sa.String(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False),
        sa.Column('price', sa.Float(), nullable=False),
        sa.Column('fees', sa.Float(), nullable=True),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('cost_basis', sa.Float(), nullable=True),
        sa.Column('proceeds', sa.Float(), nullable=True),
        sa.Column('capital_gain', sa.Float(), nullable=True),
        sa.Column('gain_type', sa.String(), nullable=True),
        sa.Column('tax_year', sa.String(), nullable=False),
        sa.Column('country', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('foreign_tax_paid', sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_tax_transactions_id'), 'tax_transactions', ['id'], unique=False)

    # Create tax_reports table
    op.create_table(
        'tax_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('tax_year', sa.String(), nullable=False),
        sa.Column('country', sa.String(), nullable=False),
        sa.Column('report_type', sa.String(), nullable=True),
        sa.Column('total_proceeds', sa.Float(), nullable=True),
        sa.Column('total_cost_basis', sa.Float(), nullable=True),
        sa.Column('total_gain_loss', sa.Float(), nullable=True),
        sa.Column('short_term_gains', sa.Float(), nullable=True),
        sa.Column('long_term_gains', sa.Float(), nullable=True),
        sa.Column('estimated_tax_owed', sa.Float(), nullable=True),
        sa.Column('report_data', sa.JSON(), nullable=True),
        sa.Column('generated_at', sa.DateTime(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('tax_reports')
    op.drop_table('tax_transactions')
    op.drop_table('tax_settings')
    op.drop_table('trades')
    op.drop_table('paper_trading_accounts')
    op.drop_table('users')
