from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Optional
from pydantic import BaseModel
from server.deps import db_session
from server.services.rate_limiter import limiter
from server.services.snapshot_exporter import generate_csv_snapshot, generate_json_snapshot
import logging
from datetime import datetime
from sqlalchemy import text

logger = logging.getLogger(__name__)

router = APIRouter()


class ReportsExportRequest(BaseModel):
    format: str = "csv"
    report_type: str = "tax"


@router.post("/reports/export")
@limiter.limit("10/minute")
async def export_reports(
    request: Request,
    data: ReportsExportRequest,
    user_id: int = 1,
    db = Depends(db_session)
):
    """
    Generate tax/portfolio report exports in CSV or JSON format
    
    Supports:
    - format: 'csv' or 'json'
    - report_type: 'tax' or 'portfolio'
    """
    try:
        query = text("""
            SELECT 
                symbol,
                name as asset_name,
                "assetClass" as asset_class,
                quantity,
                "avgCost" as avg_cost,
                "currentPrice" as current_price,
                quantity * COALESCE("currentPrice", "avgCost") as market_value,
                (quantity * COALESCE("currentPrice", "avgCost")) - (quantity * "avgCost") as unrealized_pnl,
                account
            FROM portfolio_positions
            WHERE "userId" = :user_id
            ORDER BY market_value DESC
        """)
        
        results = db.execute(query, {"user_id": user_id}).mappings().all()
        positions = [dict(row) for row in results]
        
        if data.format == "csv":
            content, checksum = generate_csv_snapshot(positions)
            return {
                "status": "success",
                "format": "csv",
                "report_type": data.report_type,
                "content": content,
                "checksum": checksum,
                "generated_at": datetime.utcnow().isoformat()
            }
        elif data.format == "json":
            export_data = {
                "report_type": data.report_type,
                "positions": positions,
                "summary": {
                    "total_positions": len(positions),
                    "total_value": sum(p.get('market_value', 0) or 0 for p in positions),
                    "unrealized_pnl": sum(p.get('unrealized_pnl', 0) or 0 for p in positions)
                },
                "generated_at": datetime.utcnow().isoformat()
            }
            content, checksum = generate_json_snapshot(export_data)
            return {
                "status": "success",
                "format": "json",
                "report_type": data.report_type,
                "content": content,
                "checksum": checksum,
                "generated_at": datetime.utcnow().isoformat()
            }
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported format: {data.format}")
            
    except Exception as e:
        logger.error(f"Error generating report export: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stub")
async def stub_endpoint():
    """Temporary stub - pending PostgreSQL migration"""
    raise HTTPException(status_code=501, detail="Route pending PostgreSQL migration")
