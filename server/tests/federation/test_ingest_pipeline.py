"""
Tests for ingest_pipeline service with fixtures
"""

import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from server.services.ingest_pipeline import (
    start_sync,
    compute_content_hash,
    check_duplicate_digest
)


@pytest.fixture
def test_db():
    """Create in-memory test database with federation tables"""
    engine = create_engine("sqlite:///:memory:")
    
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE sync_runs (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                trigger TEXT NOT NULL,
                status TEXT NOT NULL,
                started_at TIMESTAMP,
                finished_at TIMESTAMP,
                stats TEXT DEFAULT '{}'
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE import_digests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_run_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                source_id INTEGER NOT NULL,
                content_hash TEXT NOT NULL,
                entity_scope TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE positions_staging (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_run_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                source_id INTEGER NOT NULL,
                account TEXT,
                symbol TEXT NOT NULL,
                quantity REAL NOT NULL,
                avg_cost REAL,
                currency TEXT,
                as_of TIMESTAMP,
                meta TEXT DEFAULT '{}'
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE data_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                source_type TEXT NOT NULL,
                enabled INTEGER DEFAULT 1
            )
        """))
    
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    
    yield db
    
    db.close()


@pytest.mark.asyncio
async def test_start_sync(test_db):
    """Test starting a sync run"""
    sync_run_id = await start_sync(test_db, user_id=1, trigger="api")
    
    assert sync_run_id is not None
    
    result = test_db.execute(
        text("SELECT status FROM sync_runs WHERE id = :id"),
        {"id": sync_run_id}
    ).fetchone()
    
    assert result.status == "running"


def test_compute_content_hash():
    """Test content hash computation is deterministic"""
    data1 = {"positions": [{"symbol": "AAPL", "qty": 100}]}
    data2 = {"positions": [{"symbol": "AAPL", "qty": 100}]}
    
    hash1 = compute_content_hash(data1)
    hash2 = compute_content_hash(data2)
    
    assert hash1 == hash2
    assert len(hash1) == 64
