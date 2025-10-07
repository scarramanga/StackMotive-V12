from fastapi import APIRouter, HTTPException, Depends
from server.services import ibkr_flex_service
from server.deps import db_session
from server.db.qmark import qmark
from server.utils.observability import log_import_operation
import uuid

router = APIRouter()


@router.post("/import/ibkr-flex")
async def import_ibkr_flex(
    user_id: int,
    db=Depends(db_session)
):
    """
    Import portfolio data from IBKR Flex Query
    
    Requires: operator tier or higher
    Environment: IBKR_FLEX_TOKEN, IBKR_FLEX_QUERY_ID
    Rate limit: 10 requests/minute per user
    """
    with log_import_operation("ibkr", user_id) as log_ctx:
        try:
            payload = await ibkr_flex_service.get_ibkr_portfolio_payload()
            digest = payload.pop("_digest")
            
            stmt, params = qmark("""
                SELECT importedAt FROM import_digests 
                WHERE source = 'ibkr' AND digest = ?
            """, (digest,))
            result = db.execute(stmt, params)
            existing = result.mappings().first()
            
            if existing:
                log_ctx["status"] = "duplicate"
                log_ctx["itemsImported"] = 0
                return {
                    **payload,
                    "importId": None,
                    "duplicate": True,
                    "message": "Statement already imported"
                }
            
            import_id = str(uuid.uuid4())
            
            stmt, params = qmark("""
                INSERT INTO ibkr_import_history 
                (importId, userId, accountId, positionsImported, status, asOf)
                VALUES (?, ?, ?, ?, 'success', ?)
            """, (
                import_id,
                user_id,
                payload["accountId"],
                payload["positionsImported"],
                payload["asOf"]
            ))
            db.execute(stmt, params)
            
            stmt, params = qmark("""
                INSERT INTO import_digests (userId, source, digest, metadata)
                VALUES (?, 'ibkr', ?, ?::jsonb)
            """, (user_id, digest, f'{{"importId": "{import_id}"}}'))
            db.execute(stmt, params)
            
            db.commit()
            
            log_ctx["itemsImported"] = payload["positionsImported"]
            log_ctx["importId"] = import_id
            
            return {**payload, "importId": import_id}
            
        except ibkr_flex_service.IbkrFlexNotConfigured as e:
            log_ctx["status"] = "error"
            raise HTTPException(status_code=400, detail=str(e))
        except ibkr_flex_service.IbkrFlexError as e:
            log_ctx["status"] = "error"
            raise HTTPException(status_code=502, detail=f"IBKR API error: {str(e)}")
