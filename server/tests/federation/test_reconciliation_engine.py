"""
Tests for reconciliation_engine service
"""

import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from server.services.reconciliation_engine import (
    reconcile_positions,
    SOURCE_CONFIDENCE
)


@pytest.fixture
def test_db():
    """Create in-memory test database"""
    engine = create_engine("sqlite:///:memory:")
    
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE positions_staging (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_run_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                source_id INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                quantity REAL NOT NULL,
                avg_cost REAL,
                as_of TIMESTAMP,
                source_type TEXT,
                priority INTEGER
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE data_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                source_type TEXT NOT NULL,
                priority INTEGER DEFAULT 100
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE portfolio_positions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId INTEGER NOT NULL,
                symbol TEXT NOT NULL,
                quantity REAL NOT NULL,
                avgCost REAL,
                currentPrice REAL,
                lastUpdated TIMESTAMP,
                source TEXT
            )
        """))
    
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    
    yield db
    
    db.close()


def test_source_confidence_hierarchy():
    """Test confidence hierarchy is correct"""
    assert SOURCE_CONFIDENCE["ibkr_flex"] > SOURCE_CONFIDENCE["kucoin"]
    assert SOURCE_CONFIDENCE["kucoin"] > SOURCE_CONFIDENCE["csv"]
    assert SOURCE_CONFIDENCE["csv"] > SOURCE_CONFIDENCE["manual"]


def test_reconcile_single_source(test_db):
    """Test reconciliation with single source"""
    test_db.execute(
        text("""
            INSERT INTO data_sources (id, user_id, source_type, priority)
            VALUES (1, 1, 'ibkr_flex', 50)
        """)
    )
    
    test_db.execute(
        text("""
            INSERT INTO positions_staging 
            (sync_run_id, user_id, source_id, symbol, quantity, avg_cost, as_of, source_type, priority)
            VALUES ('test-sync', 1, 1, 'AAPL', 100, 150.0, '2025-10-07', 'ibkr_flex', 50)
        """)
    )
    test_db.commit()
    
    summary = reconcile_positions(test_db, "test-sync", user_id=1)
    
    assert summary["inserted"] == 1
    assert summary["updated"] == 0
    
    result = test_db.execute(
        text("SELECT quantity, source FROM portfolio_positions WHERE userId = 1 AND symbol = 'AAPL'")
    ).fetchone()
    
    assert result.quantity == 100
    assert result.source == "ibkr_flex"


def test_reconcile_priority_wins(test_db):
    """Test that lower priority number wins"""
    test_db.execute(
        text("INSERT INTO data_sources (id, user_id, source_type, priority) VALUES (1, 1, 'ibkr_flex', 50)")
    )
    test_db.execute(
        text("INSERT INTO data_sources (id, user_id, source_type, priority) VALUES (2, 1, 'csv', 100)")
    )
    
    test_db.execute(
        text("""
            INSERT INTO positions_staging
            (sync_run_id, user_id, source_id, symbol, quantity, avg_cost, as_of, source_type, priority)
            VALUES ('test-sync', 1, 1, 'AAPL', 100, 150.0, '2025-10-07', 'ibkr_flex', 50)
        """)
    )
    test_db.execute(
        text("""
            INSERT INTO positions_staging
            (sync_run_id, user_id, source_id, symbol, quantity, avg_cost, as_of, source_type, priority)
            VALUES ('test-sync', 1, 2, 'AAPL', 200, 160.0, '2025-10-07', 'csv', 100)
        """)
    )
    test_db.commit()
    
    summary = reconcile_positions(test_db, "test-sync", user_id=1)
    
    result = test_db.execute(
        text("SELECT quantity, source FROM portfolio_positions WHERE userId = 1 AND symbol = 'AAPL'")
    ).fetchone()
    
    assert result.quantity == 100
    assert result.source == "ibkr_flex"
