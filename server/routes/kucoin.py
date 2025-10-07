from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from server.deps import db_session
from server.auth import get_current_user
from server.models.user import User
from server.services.kucoin_service import KuCoinService

router = APIRouter()


@router.get("/accounts")
async def get_kucoin_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    try:
        service = KuCoinService()
        result = await service.get_accounts(user_id=current_user.id)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch KuCoin accounts: {str(e)}")


@router.get("/fills")
async def get_kucoin_fills(
    symbol: Optional[str] = Query(None, description="Filter by trading pair symbol"),
    limit: int = Query(50, ge=1, le=500, description="Number of fills to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(db_session),
):
    try:
        service = KuCoinService()
        result = await service.get_fills(
            user_id=current_user.id, symbol=symbol, limit=limit
        )
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch KuCoin fills: {str(e)}")
