"""
Ingest Pipeline Service
Orchestrates data source adapters → staging tables with idempotency via federation_import_digests
"""

import os
import logging
import hashlib
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from uuid import uuid4

from server.services.federation_registry import list_sources

logger = logging.getLogger(__name__)

SYNC_MAX_CONCURRENCY = int(os.getenv("SYNC_MAX_CONCURRENCY", "1"))
SYNC_DEDUP_WINDOW_SEC = int(os.getenv("SYNC_DEDUP_WINDOW_SEC", "86400"))


def compute_content_hash(data: Any) -> str:
    """Compute SHA256 hash of normalized data for idempotency"""
    normalized = json.dumps(data, sort_keys=True)
    return hashlib.sha256(normalized.encode()).hexdigest()


async def check_duplicate_digest(
    db: Session,
    user_id: int,
    source_id: int,
    content_hash: str,
    entity_scope: str
) -> bool:
    """Check if this digest was already imported within dedup window"""
    result = db.execute(
        text("""
            SELECT id FROM federation_import_digests
            WHERE user_id = :user_id
              AND source_id = :source_id
              AND content_hash = :content_hash
              AND entity_scope = :entity_scope
              AND created_at > NOW() - INTERVAL '1 second' * :dedup_window
            LIMIT 1
        """),
        {
            "user_id": user_id,
            "source_id": source_id,
            "content_hash": content_hash,
            "entity_scope": entity_scope,
            "dedup_window": SYNC_DEDUP_WINDOW_SEC
        }
    )
    return result.fetchone() is not None


async def start_sync(db: Session, user_id: int, trigger: str = "api") -> str:
    """
    Start sync run for user
    
    Args:
        db: Database session
        user_id: User ID
        trigger: Trigger type (manual, scheduled, api)
        
    Returns:
        sync_run_id (UUID string)
        
    Raises:
        RuntimeError: If concurrent sync already running
    """
    running = db.execute(
        text("""
            SELECT id FROM sync_runs
            WHERE user_id = :user_id
              AND status IN ('queued', 'running')
            LIMIT 1
        """),
        {"user_id": user_id}
    ).fetchone()
    
    if running and SYNC_MAX_CONCURRENCY == 1:
        raise RuntimeError(f"Sync already running for user {user_id}")
    
    sync_run_id = str(uuid4())
    db.execute(
        text("""
            INSERT INTO sync_runs (id, user_id, trigger, status, started_at, stats)
            VALUES (:id, :user_id, :trigger, 'running', NOW(), '{}')
        """),
        {"id": sync_run_id, "user_id": user_id, "trigger": trigger}
    )
    db.commit()
    
    return sync_run_id


async def ingest_ibkr_source(
    db: Session,
    sync_run_id: str,
    user_id: int,
    source_id: int,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """Ingest IBKR Flex data"""
    try:
        from server.services.ibkr_flex_service import get_ibkr_portfolio_payload
        
        os.environ["IBKR_FLEX_TOKEN"] = config.get("flex_token", "")
        os.environ["IBKR_FLEX_QUERY_ID"] = config.get("flex_query_id", "")
        
        payload = await get_ibkr_portfolio_payload()
        
        content_hash = payload.get("_digest") or compute_content_hash(payload["portfolio"]["positions"])
        if await check_duplicate_digest(db, user_id, source_id, content_hash, "positions"):
            logger.info(f"Skipping duplicate IBKR import: {content_hash[:8]}")
            return {"skipped": True, "reason": "duplicate"}
        
        db.execute(
            text("""
                INSERT INTO federation_import_digests (sync_run_id, user_id, source_id, content_hash, entity_scope)
                VALUES (:sync_run_id, :user_id, :source_id, :content_hash, 'positions')
            """),
            {
                "sync_run_id": sync_run_id,
                "user_id": user_id,
                "source_id": source_id,
                "content_hash": content_hash
            }
        )
        
        positions = payload["portfolio"]["positions"]
        for pos in positions:
            db.execute(
                text("""
                    INSERT INTO positions_staging 
                    (sync_run_id, user_id, source_id, account, symbol, quantity, avg_cost, currency, as_of, meta)
                    VALUES (:sync_run_id, :user_id, :source_id, :account, :symbol, :quantity, :avg_cost, :currency, :as_of, :meta)
                """),
                {
                    "sync_run_id": sync_run_id,
                    "user_id": user_id,
                    "source_id": source_id,
                    "account": payload.get("accountId", ""),
                    "symbol": pos["symbol"],
                    "quantity": pos["quantity"],
                    "avg_cost": pos.get("markPrice", 0),
                    "currency": pos.get("currency", "USD"),
                    "as_of": payload.get("asOf"),
                    "meta": json.dumps({"description": pos.get("description", "")})
                }
            )
        
        db.commit()
        return {"imported": len(positions)}
        
    except Exception as e:
        logger.error(f"IBKR import failed: {e}")
        return {"error": str(e)}


async def ingest_kucoin_source(
    db: Session,
    sync_run_id: str,
    user_id: int,
    source_id: int,
    config: Dict[str, Any]
) -> Dict[str, Any]:
    """Ingest KuCoin data"""
    try:
        from server.services.kucoin_service import KuCoinService
        
        service = KuCoinService(
            api_key=config.get("api_key"),
            api_secret=config.get("api_secret"),
            api_passphrase=config.get("api_passphrase")
        )
        
        data = await service.get_accounts(user_id)
        
        if "error" in data:
            return {"error": data["error"]}
        
        holdings = data.get("holdings", [])
        content_hash = compute_content_hash(holdings)
        
        if await check_duplicate_digest(db, user_id, source_id, content_hash, "positions"):
            logger.info(f"Skipping duplicate KuCoin import: {content_hash[:8]}")
            return {"skipped": True, "reason": "duplicate"}
        
        db.execute(
            text("""
                INSERT INTO federation_import_digests (sync_run_id, user_id, source_id, content_hash, entity_scope)
                VALUES (:sync_run_id, :user_id, :source_id, :content_hash, 'positions')
            """),
            {
                "sync_run_id": sync_run_id,
                "user_id": user_id,
                "source_id": source_id,
                "content_hash": content_hash
            }
        )
        
        for holding in holdings:
            db.execute(
                text("""
                    INSERT INTO positions_staging
                    (sync_run_id, user_id, source_id, account, symbol, quantity, avg_cost, currency, as_of, meta)
                    VALUES (:sync_run_id, :user_id, :source_id, :account, :symbol, :quantity, :avg_cost, :currency, :as_of, :meta)
                """),
                {
                    "sync_run_id": sync_run_id,
                    "user_id": user_id,
                    "source_id": source_id,
                    "account": holding.get("accountType", "trade"),
                    "symbol": holding["symbol"],
                    "quantity": holding["quantity"],
                    "avg_cost": 0,
                    "currency": "USD",
                    "as_of": data.get("asOf"),
                    "meta": json.dumps({"available": holding.get("available", 0)})
                }
            )
        
        db.commit()
        return {"imported": len(holdings)}
        
    except Exception as e:
        logger.error(f"KuCoin import failed: {e}")
        return {"error": str(e)}


async def run_full_sync(db: Session, user_id: int, trigger: str = "api") -> Dict[str, Any]:
    """
    Run full sync for all enabled sources
    
    Returns sync_run summary with stats
    """
    try:
        sync_run_id = await start_sync(db, user_id, trigger)
        
        sources = list_sources(db, user_id)
        enabled_sources = [s for s in sources if s["enabled"]]
        
        stats = {
            "sources_processed": 0,
            "sources_skipped": 0,
            "sources_failed": 0,
            "positions_imported": 0,
            "errors": []
        }
        
        for source in enabled_sources:
            source_type = source["source_type"]
            source_id = source["id"]
            config = source.get("config", {})
            
            try:
                if source_type == "ibkr_flex":
                    result = await ingest_ibkr_source(db, sync_run_id, user_id, source_id, config)
                elif source_type == "kucoin":
                    result = await ingest_kucoin_source(db, sync_run_id, user_id, source_id, config)
                elif source_type == "csv":
                    continue
                elif source_type == "manual":
                    continue
                else:
                    logger.warning(f"Unknown source type: {source_type}")
                    continue
                
                if result.get("error"):
                    stats["sources_failed"] += 1
                    stats["errors"].append(f"{source_type}: {result['error']}")
                elif result.get("skipped"):
                    stats["sources_skipped"] += 1
                else:
                    stats["sources_processed"] += 1
                    stats["positions_imported"] += result.get("imported", 0)
                    
            except Exception as e:
                stats["sources_failed"] += 1
                stats["errors"].append(f"{source_type}: {str(e)}")
                logger.error(f"Source {source_id} failed: {e}")
        
        status = "completed" if stats["sources_failed"] == 0 else "partial"
        db.execute(
            text("""
                UPDATE sync_runs
                SET status = :status, finished_at = NOW(), stats = :stats
                WHERE id = :sync_run_id
            """),
            {"sync_run_id": sync_run_id, "status": status, "stats": json.dumps(stats)}
        )
        db.commit()
        
        return {
            "sync_run_id": sync_run_id,
            "status": status,
            "stats": stats
        }
        
    except Exception as e:
        logger.error(f"Full sync failed: {e}")
        if 'sync_run_id' in locals():
            db.execute(
                text("""
                    UPDATE sync_runs
                    SET status = 'failed', finished_at = NOW(), stats = :stats
                    WHERE id = :sync_run_id
                """),
                {"sync_run_id": sync_run_id, "stats": json.dumps({"error": str(e)})}
            )
            db.commit()
        raise
