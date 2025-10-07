"""
Tests for ingest_pipeline service with fixtures
"""

import os
import sys

os.environ.setdefault("STACKMOTIVE_JWT_SECRET", "test-secret")
os.environ.setdefault("STACKMOTIVE_DEV_MODE", "true")

repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from sqlalchemy import text

from server.database import get_db
from server.services.ingest_pipeline import (
    start_sync,
    compute_content_hash,
    check_duplicate_digest
)


@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Clean up test data before and after each test"""
    db = next(get_db())
    
    try:
        db.execute(text("DELETE FROM sync_runs WHERE user_id = 1"))
        db.execute(text("DELETE FROM federation_import_digests WHERE user_id = 1"))
        db.execute(text("DELETE FROM positions_staging WHERE user_id = 1"))
        db.commit()
    except:
        db.rollback()
    
    yield
    
    try:
        db.execute(text("DELETE FROM sync_runs WHERE user_id = 1"))
        db.execute(text("DELETE FROM federation_import_digests WHERE user_id = 1"))
        db.execute(text("DELETE FROM positions_staging WHERE user_id = 1"))
        db.commit()
    except:
        db.rollback()
    finally:
        db.close()


@pytest.mark.asyncio
async def test_start_sync():
    """Test starting a sync run"""
    db = next(get_db())
    
    try:
        sync_run_id = await start_sync(db, user_id=1, trigger="api")
        
        assert sync_run_id is not None
        
        result = db.execute(
            text("SELECT status FROM sync_runs WHERE id = :id"),
            {"id": sync_run_id}
        ).fetchone()
        
        assert result.status == "running"
    finally:
        db.close()


def test_compute_content_hash():
    """Test content hash computation is deterministic"""
    data1 = {"positions": [{"symbol": "AAPL", "qty": 100}]}
    data2 = {"positions": [{"symbol": "AAPL", "qty": 100}]}
    
    hash1 = compute_content_hash(data1)
    hash2 = compute_content_hash(data2)
    
    assert hash1 == hash2
    assert len(hash1) == 64
