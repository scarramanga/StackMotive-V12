"""phase11_federation_core

Revision ID: 4e21f1a1fedc
Revises: 3f42bce0a98b
Create Date: 2025-10-07 22:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4e21f1a1fedc'
down_revision: Union[str, None] = '3f42bce0a98b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS data_sources (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL,
            source_type TEXT NOT NULL CHECK (source_type IN ('ibkr_flex', 'kucoin', 'csv', 'manual')),
            display_name TEXT,
            priority INTEGER DEFAULT 100,
            enabled BOOLEAN DEFAULT TRUE,
            config JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, source_type, display_name)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_data_sources_user_id ON data_sources(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_data_sources_enabled ON data_sources(enabled)")
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS sync_runs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER NOT NULL,
            trigger TEXT NOT NULL CHECK (trigger IN ('manual', 'scheduled', 'api')),
            status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'completed', 'failed', 'partial')),
            started_at TIMESTAMP,
            finished_at TIMESTAMP,
            stats JSONB DEFAULT '{}'
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_sync_runs_user_id ON sync_runs(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_sync_runs_status ON sync_runs(status)")
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS import_digests (
            id SERIAL PRIMARY KEY,
            sync_run_id UUID NOT NULL,
            user_id INTEGER NOT NULL,
            source_id INTEGER NOT NULL,
            content_hash TEXT NOT NULL,
            entity_scope TEXT NOT NULL CHECK (entity_scope IN ('positions', 'trades', 'cash')),
            dedup_window_sec INTEGER DEFAULT 86400,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, source_id, content_hash, entity_scope)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_import_digests_user_id ON import_digests(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_import_digests_sync_run_id ON import_digests(sync_run_id)")
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS positions_staging (
            id SERIAL PRIMARY KEY,
            sync_run_id UUID NOT NULL,
            user_id INTEGER NOT NULL,
            source_id INTEGER NOT NULL,
            account TEXT,
            symbol TEXT NOT NULL,
            quantity NUMERIC NOT NULL,
            avg_cost NUMERIC,
            currency TEXT,
            as_of TIMESTAMP,
            meta JSONB DEFAULT '{}'
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_positions_staging_user_id ON positions_staging(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_positions_staging_sync_run_id ON positions_staging(sync_run_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_positions_staging_symbol ON positions_staging(user_id, symbol)")
    
    op.execute("""
        CREATE TABLE IF NOT EXISTS cash_events_staging (
            id SERIAL PRIMARY KEY,
            sync_run_id UUID NOT NULL,
            user_id INTEGER NOT NULL,
            source_id INTEGER NOT NULL,
            event_type TEXT NOT NULL CHECK (event_type IN ('deposit', 'withdrawal', 'interest', 'dividend')),
            amount NUMERIC NOT NULL,
            currency TEXT NOT NULL DEFAULT 'USD',
            event_date TIMESTAMP NOT NULL,
            account_id TEXT,
            description TEXT,
            meta JSONB DEFAULT '{}'
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_cash_events_staging_user_id ON cash_events_staging(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_cash_events_staging_sync_run_id ON cash_events_staging(sync_run_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS cash_events_staging")
    op.execute("DROP TABLE IF EXISTS positions_staging")
    op.execute("DROP TABLE IF EXISTS import_digests")
    op.execute("DROP TABLE IF EXISTS sync_runs")
    op.execute("DROP TABLE IF EXISTS data_sources")
