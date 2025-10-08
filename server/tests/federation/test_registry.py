"""
Tests for federation_registry service
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
from server.services.federation_registry import (
    list_sources,
    register_source,
    enable_source,
    disable_source,
    update_source_config,
    FEDERATION_DEFAULT_PRIORITY
)


@pytest.fixture(autouse=True)
def cleanup_test_data():
    """Clean up test data before and after each test"""
    db = next(get_db())
    
    try:
        db.execute(text("DELETE FROM data_sources WHERE user_id IN (1, 2)"))
        db.commit()
    except:
        db.rollback()
    
    yield
    
    try:
        db.execute(text("DELETE FROM data_sources WHERE user_id IN (1, 2)"))
        db.commit()
    except:
        db.rollback()
    finally:
        db.close()


def test_register_source_ibkr(cleanup_test_data):
    """Test registering IBKR source with required config"""
    db = next(get_db())
    
    try:
        source = register_source(
            db,
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
    finally:
        db.close()


def test_register_source_missing_config(cleanup_test_data):
    """Test that missing required config raises error"""
    db = next(get_db())
    
    try:
        with pytest.raises(ValueError, match="Missing required config keys"):
            register_source(
                db,
                user_id=1,
                source_type="ibkr_flex",
                config={"flex_token": "test_token"}
            )
    finally:
        db.close()


def test_register_source_invalid_type(cleanup_test_data):
    """Test that invalid source type raises error"""
    db = next(get_db())
    
    try:
        with pytest.raises(ValueError, match="Invalid source_type"):
            register_source(
                db,
                user_id=1,
                source_type="invalid_source"
            )
    finally:
        db.close()


def test_list_sources(cleanup_test_data):
    """Test listing sources for a user"""
    db = next(get_db())
    
    try:
        register_source(
            db,
            user_id=1,
            source_type="ibkr_flex",
            config={"flex_token": "t1", "flex_query_id": "q1"},
            priority=50
        )
        register_source(
            db,
            user_id=1,
            source_type="csv",
            priority=100
        )
        register_source(
            db,
            user_id=2,
            source_type="kucoin",
            config={"api_key": "k", "api_secret": "s", "api_passphrase": "p"}
        )
        
        user1_sources = list_sources(db, user_id=1)
        assert len(user1_sources) == 2
        assert user1_sources[0]["priority"] == 50
        assert user1_sources[1]["priority"] == 100
    finally:
        db.close()


def test_enable_disable_source(cleanup_test_data):
    """Test enabling and disabling sources"""
    db = next(get_db())
    
    try:
        source = register_source(
            db,
            user_id=1,
            source_type="manual"
        )
        source_id = source["id"]
        
        assert disable_source(db, source_id, user_id=1) is True
        
        sources = list_sources(db, user_id=1)
        assert sources[0]["enabled"] is False
        
        assert enable_source(db, source_id, user_id=1) is True
        
        sources = list_sources(db, user_id=1)
        assert sources[0]["enabled"] is True
    finally:
        db.close()


def test_update_source_config(cleanup_test_data):
    """Test updating source configuration"""
    db = next(get_db())
    
    try:
        source = register_source(
            db,
            user_id=1,
            source_type="kucoin",
            config={"api_key": "old_key", "api_secret": "old_secret", "api_passphrase": "old_pass"}
        )
        
        updated = update_source_config(
            db,
            source["id"],
            user_id=1,
            config={"api_key": "new_key", "api_secret": "new_secret", "api_passphrase": "new_pass"}
        )
        
        assert updated is not None
        assert updated["config"]["api_key"] == "new_key"
    finally:
        db.close()


def test_update_nonexistent_source(cleanup_test_data):
    """Test updating nonexistent source returns None"""
    db = next(get_db())
    
    try:
        result = update_source_config(
            db,
            source_id=999,
            user_id=1,
            config={}
        )
        
        assert result is None
    finally:
        db.close()
