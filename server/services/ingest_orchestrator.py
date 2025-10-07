"""
Portfolio data ingestion orchestrator
Unifies IBKR Flex, KuCoin, and CSV imports into normalized portfolio_positions and cash_events tables
"""
import hashlib
from typing import Dict, Any, List
from datetime import datetime
from server.services import ibkr_flex_service
from server.services.kucoin_service import KuCoinService
from server.db.qmark import qmark
from server.utils.observability import log_import_operation


def compute_batch_digest(user_id: int, source: str, positions: List[Dict], timestamp: str) -> str:
    """Compute digest for idempotency checking"""
    content = f"{user_id}|{source}|{len(positions)}|{timestamp}"
    return hashlib.sha256(content.encode()).hexdigest()


async def ingest_ibkr(user_id: int, db) -> dict:
    """
    Ingest IBKR Flex Query data into portfolio_positions and cash_events
    
    Returns:
        Dict with imported counts and import_id
    """
    with log_import_operation("ibkr", user_id) as log_ctx:
        payload = await ibkr_flex_service.get_ibkr_portfolio_payload()
        
        digest = compute_batch_digest(
            user_id, 
            "ibkr", 
            payload["portfolio"]["positions"],
            payload["asOf"]
        )
        
        stmt, params = qmark("""
            SELECT importId FROM import_digests 
            WHERE source = ? AND digest = ?
        """, ("ibkr", digest))
        existing = db.execute(stmt, params).mappings().first()
        
        if existing:
            log_ctx["status"] = "duplicate"
            return {"imported": 0, "duplicate": True, "message": "Already imported"}
        
        import_id = f"ibkr_{user_id}_{int(datetime.now().timestamp())}"
        positions_imported = 0
        cash_events_imported = 0
        
        for pos in payload["portfolio"]["positions"]:
            stmt, params = qmark("""
                INSERT INTO portfolio_positions 
                (userId, symbol, name, quantity, avgCost, currentPrice, assetClass, 
                 account, currency, source, asOf)
                VALUES (?, ?, ?, ?, ?, ?, 'equity', ?, ?, 'ibkr', ?)
                ON CONFLICT (userId, symbol, account) 
                DO UPDATE SET 
                    quantity = EXCLUDED.quantity,
                    currentPrice = EXCLUDED.currentPrice,
                    lastUpdated = CURRENT_TIMESTAMP
            """, (
                user_id,
                pos["symbol"],
                pos.get("description", ""),
                pos["quantity"],
                pos["markPrice"],
                pos["markPrice"],
                payload["accountId"],
                pos.get("currency", "USD"),
                payload["asOf"]
            ))
            db.execute(stmt, params)
            positions_imported += 1
        
        for currency, amount in payload["cashByCcy"].items():
            if amount != 0:
                stmt, params = qmark("""
                    INSERT INTO cash_events 
                    (userId, eventType, amount, currency, eventDate, source, accountId)
                    VALUES (?, 'deposit', ?, ?, ?, 'ibkr', ?)
                """, (
                    user_id,
                    amount,
                    currency,
                    payload["asOf"],
                    payload["accountId"]
                ))
                db.execute(stmt, params)
                cash_events_imported += 1
        
        stmt, params = qmark("""
            INSERT INTO import_digests (userId, source, digest, metadata)
            VALUES (?, 'ibkr', ?, ?)
        """, (user_id, digest, f'{{"importId": "{import_id}"}}'))
        db.execute(stmt, params)
        
        db.commit()
        
        log_ctx["itemsImported"] = positions_imported + cash_events_imported
        log_ctx["importId"] = import_id
        
        return {
            "imported": positions_imported + cash_events_imported,
            "positions": positions_imported,
            "cashEvents": cash_events_imported,
            "importId": import_id
        }


async def ingest_kucoin(user_id: int, db) -> dict:
    """
    Ingest KuCoin account data into portfolio_positions and cash_events
    """
    with log_import_operation("kucoin", user_id) as log_ctx:
        service = KuCoinService()
        result = await service.get_accounts(user_id)
        
        if "error" in result:
            log_ctx["status"] = "error"
            return {"error": result["error"]}
        
        import_id = f"kucoin_{user_id}_{int(datetime.now().timestamp())}"
        positions_imported = 0
        cash_events_imported = 0
        
        for holding in result["holdings"]:
            stmt, params = qmark("""
                INSERT INTO portfolio_positions 
                (userId, symbol, quantity, currentPrice, assetClass, account, source, asOf)
                VALUES (?, ?, ?, 0, 'crypto', ?, 'kucoin', ?)
                ON CONFLICT (userId, symbol, account) 
                DO UPDATE SET 
                    quantity = EXCLUDED.quantity,
                    lastUpdated = CURRENT_TIMESTAMP
            """, (
                user_id,
                holding["symbol"],
                holding["quantity"],
                holding["accountType"],
                result["asOf"]
            ))
            db.execute(stmt, params)
            positions_imported += 1
        
        for currency_key, amount in result["cashBalances"].items():
            stmt, params = qmark("""
                INSERT INTO cash_events 
                (userId, eventType, amount, currency, eventDate, source)
                VALUES (?, 'deposit', ?, ?, ?, 'kucoin')
            """, (
                user_id,
                amount,
                currency_key.split('_')[0],
                result["asOf"]
            ))
            db.execute(stmt, params)
            cash_events_imported += 1
        
        db.commit()
        
        log_ctx["itemsImported"] = positions_imported + cash_events_imported
        log_ctx["importId"] = import_id
        
        return {
            "imported": positions_imported + cash_events_imported,
            "positions": positions_imported,
            "cashEvents": cash_events_imported,
            "importId": import_id
        }


async def ingest_csv(user_id: int, csv_data: str, mapping: dict, db) -> dict:
    """
    Ingest CSV data - delegates to existing csv_import_service
    CSV import already writes to portfolio_positions, just return the result
    """
    from server.services.csv_import_service import parse_csv_with_mapping
    
    positions, errors = parse_csv_with_mapping(csv_data, mapping, user_id)
    
    return {
        "positions": positions,
        "errors": errors
    }
