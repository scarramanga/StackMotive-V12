from fastapi import APIRouter, HTTPException

router = APIRouter()


@router.get("/stub")
async def stub_endpoint():
    """Temporary stub - pending PostgreSQL migration"""
    raise HTTPException(status_code=501, detail="Route pending PostgreSQL migration")
