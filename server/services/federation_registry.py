"""
Federation Registry Service
Manages data source registration and configuration per user
"""

import os
import logging
import json
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

FEDERATION_DEFAULT_PRIORITY = int(os.getenv("FEDERATION_DEFAULT_PRIORITY", "100"))


def _iso8601(ts):
    """
    Normalize timestamp-like values to ISO 8601 string.
    Accepts datetime (naive or aware), ISO string, or None.
    Returns None if input is falsy.
    """
    if not ts:
        return None
    if isinstance(ts, datetime):
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        return ts.isoformat()
    if isinstance(ts, str):
        s = ts.strip()
        s = s.replace(' ', 'T')
        if s.endswith('Z'):
            s = s[:-1] + '+00:00'
        try:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt.isoformat()
        except Exception:
            return s
    return str(ts)

REQUIRED_CONFIG_KEYS = {
    "ibkr_flex": ["flex_token", "flex_query_id"],
    "kucoin": ["api_key", "api_secret", "api_passphrase"],
    "csv": [],
    "manual": []
}


def list_sources(db: Session, user_id: int) -> List[Dict[str, Any]]:
    """
    List all data sources for a user
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        List of data source dicts
    """
    result = db.execute(
        text("""
            SELECT id, user_id, source_type, display_name, priority, enabled, config, created_at, updated_at
            FROM data_sources
            WHERE user_id = :user_id
            ORDER BY priority ASC, created_at ASC
        """),
        {"user_id": user_id}
    )
    
    sources = []
    for row in result:
        config = row.config
        if isinstance(config, str):
            config = json.loads(config) if config else {}
        
        sources.append({
            "id": row.id,
            "user_id": row.user_id,
            "source_type": row.source_type,
            "display_name": row.display_name,
            "priority": row.priority,
            "enabled": row.enabled,
            "config": config,
            "created_at": _iso8601(row.created_at),
            "updated_at": _iso8601(row.updated_at)
        })
    
    return sources


def register_source(
    db: Session,
    user_id: int,
    source_type: str,
    display_name: Optional[str] = None,
    config: Optional[Dict[str, Any]] = None,
    priority: int = FEDERATION_DEFAULT_PRIORITY
) -> Dict[str, Any]:
    """
    Register a new data source for a user
    
    Args:
        db: Database session
        user_id: User ID
        source_type: Type of source (ibkr_flex, kucoin, csv, manual)
        display_name: Optional display name
        config: Source-specific configuration
        priority: Priority (lower = higher priority)
        
    Returns:
        Created source dict
        
    Raises:
        ValueError: If validation fails
    """
    if source_type not in REQUIRED_CONFIG_KEYS:
        raise ValueError(f"Invalid source_type: {source_type}")
    
    config = config or {}
    
    required_keys = REQUIRED_CONFIG_KEYS[source_type]
    missing_keys = [k for k in required_keys if k not in config]
    if missing_keys:
        raise ValueError(f"Missing required config keys for {source_type}: {missing_keys}")
    
    if display_name is None:
        display_name = source_type
    
    try:
        result = db.execute(
            text("""
                INSERT INTO data_sources (user_id, source_type, display_name, priority, enabled, config)
                VALUES (:user_id, :source_type, :display_name, :priority, TRUE, :config)
                RETURNING id, user_id, source_type, display_name, priority, enabled, config, created_at, updated_at
            """),
            {
                "user_id": user_id,
                "source_type": source_type,
                "display_name": display_name,
                "priority": priority,
                "config": json.dumps(config)
            }
        )
        
        row = result.fetchone()
        db.commit()
        
        returned_config = row.config
        if isinstance(returned_config, str):
            returned_config = json.loads(returned_config) if returned_config else {}
        
        return {
            "id": row.id,
            "user_id": row.user_id,
            "source_type": row.source_type,
            "display_name": row.display_name,
            "priority": row.priority,
            "enabled": row.enabled,
            "config": returned_config,
            "created_at": _iso8601(row.created_at),
            "updated_at": _iso8601(row.updated_at)
        }
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to register source: {e}")
        raise


def enable_source(db: Session, source_id: int, user_id: int) -> bool:
    """Enable a data source"""
    result = db.execute(
        text("""
            UPDATE data_sources
            SET enabled = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE id = :source_id AND user_id = :user_id
            RETURNING id
        """),
        {"source_id": source_id, "user_id": user_id}
    )
    db.commit()
    return result.fetchone() is not None


def disable_source(db: Session, source_id: int, user_id: int) -> bool:
    """Disable a data source"""
    result = db.execute(
        text("""
            UPDATE data_sources
            SET enabled = FALSE, updated_at = CURRENT_TIMESTAMP
            WHERE id = :source_id AND user_id = :user_id
            RETURNING id
        """),
        {"source_id": source_id, "user_id": user_id}
    )
    db.commit()
    return result.fetchone() is not None


def update_source_config(
    db: Session,
    source_id: int,
    user_id: int,
    config: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Update configuration for a data source
    
    Args:
        db: Database session
        source_id: Source ID
        user_id: User ID
        config: New configuration
        
    Returns:
        Updated source dict or None if not found
    """
    source = db.execute(
        text("SELECT source_type FROM data_sources WHERE id = :source_id AND user_id = :user_id"),
        {"source_id": source_id, "user_id": user_id}
    ).fetchone()
    
    if not source:
        return None
    
    required_keys = REQUIRED_CONFIG_KEYS[source.source_type]
    missing_keys = [k for k in required_keys if k not in config]
    if missing_keys:
        raise ValueError(f"Missing required config keys: {missing_keys}")
    
    result = db.execute(
        text("""
            UPDATE data_sources
            SET config = :config, updated_at = CURRENT_TIMESTAMP
            WHERE id = :source_id AND user_id = :user_id
            RETURNING id, user_id, source_type, display_name, priority, enabled, config, created_at, updated_at
        """),
        {"source_id": source_id, "user_id": user_id, "config": json.dumps(config)}
    )
    
    row = result.fetchone()
    db.commit()
    
    if not row:
        return None
    
    returned_config = row.config
    if isinstance(returned_config, str):
        returned_config = json.loads(returned_config) if returned_config else {}
        
    return {
        "id": row.id,
        "user_id": row.user_id,
        "source_type": row.source_type,
        "display_name": row.display_name,
        "priority": row.priority,
        "enabled": row.enabled,
        "config": returned_config,
        "created_at": _iso8601(row.created_at),
        "updated_at": _iso8601(row.updated_at)
    }
