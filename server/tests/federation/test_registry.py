"""
Tests for federation_registry service
"""

import os
import sys
repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, repo_root)

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from server.services.federation_registry import (
    list_sources,
    register_source,
    enable_source,
    disable_source,
    update_source_config,
    FEDERATION_DEFAULT_PRIORITY
)


@pytest.fixture
def test_db():
    """Create in-memory test database with federation tables"""
    engine = create_engine("sqlite:///:memory:")
    
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE data_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                source_type TEXT NOT NULL,
                display_name TEXT,
                priority INTEGER DEFAULT 100,
                enabled BOOLEAN DEFAULT 1,
                config TEXT DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """))
    
    TestingSessionLocal = sessionmaker(bind=engine)
    db = TestingSessionLocal()
    
    yield db
    
    db.close()


def test_register_source_ibkr(test_db):
    """Test registering IBKR source with required config"""
    source = register_source(
        test_db,
        user_id=1,
        source_type="ibkr_flex",
        display_name="IBKR Main",
        config={"flex_token": "test_token", "flex_query_id": "12345"}
    )
    
    assert source["id"] is not None
    assert source["user_id"] == 1
    assert source["source_type"] == "ibkr_flex"
    assert source["display_name"] == "IBKR Main"
    assert source["enabled"] is True
    assert source["priority"] == FEDERATION_DEFAULT_PRIORITY


def test_register_source_missing_config(test_db):
    """Test that missing required config raises error"""
    with pytest.raises(ValueError, match="Missing required config keys"):
        register_source(
            test_db,
            user_id=1,
            source_type="ibkr_flex",
            config={"flex_token": "test_token"}
        )


def test_register_source_invalid_type(test_db):
    """Test that invalid source type raises error"""
    with pytest.raises(ValueError, match="Invalid source_type"):
        register_source(
            test_db,
            user_id=1,
            source_type="invalid_source"
        )


def test_list_sources(test_db):
    """Test listing sources for a user"""
    register_source(
        test_db,
        user_id=1,
        source_type="ibkr_flex",
        config={"flex_token": "t1", "flex_query_id": "q1"},
        priority=50
    )
    register_source(
        test_db,
        user_id=1,
        source_type="csv",
        priority=100
    )
    register_source(
        test_db,
        user_id=2,
        source_type="kucoin",
        config={"api_key": "k", "api_secret": "s", "api_passphrase": "p"}
    )
    
    user1_sources = list_sources(test_db, user_id=1)
    assert len(user1_sources) == 2
    assert user1_sources[0]["priority"] == 50
    assert user1_sources[1]["priority"] == 100


def test_enable_disable_source(test_db):
    """Test enabling and disabling sources"""
    source = register_source(
        test_db,
        user_id=1,
        source_type="manual"
    )
    source_id = source["id"]
    
    assert disable_source(test_db, source_id, user_id=1) is True
    
    sources = list_sources(test_db, user_id=1)
    assert sources[0]["enabled"] is False
    
    assert enable_source(test_db, source_id, user_id=1) is True
    
    sources = list_sources(test_db, user_id=1)
    assert sources[0]["enabled"] is True


def test_update_source_config(test_db):
    """Test updating source configuration"""
    source = register_source(
        test_db,
        user_id=1,
        source_type="kucoin",
        config={"api_key": "old_key", "api_secret": "old_secret", "api_passphrase": "old_pass"}
    )
    
    updated = update_source_config(
        test_db,
        source["id"],
        user_id=1,
        config={"api_key": "new_key", "api_secret": "new_secret", "api_passphrase": "new_pass"}
    )
    
    assert updated is not None
    assert updated["config"]["api_key"] == "new_key"


def test_update_nonexistent_source(test_db):
    """Test updating nonexistent source returns None"""
    result = update_source_config(
        test_db,
        source_id=999,
        user_id=1,
        config={}
    )
    
    assert result is None
