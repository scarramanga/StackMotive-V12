from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from server.database import get_db
from server.models.user import User
from jose import jwt
from server.config.settings import settings
from fastapi.security import HTTPBearer

router = APIRouter()
auth = HTTPBearer()

def get_user_id(token: str):
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/start")
def start_onboarding(token=Depends(auth), db: Session = Depends(get_db)):
    uid = int(get_user_id(token.credentials))
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True, "step": "started"}

@router.post("/complete")
def complete_onboarding(token=Depends(auth), db: Session = Depends(get_db)):
    uid = int(get_user_id(token.credentials))
    user = db.query(User).filter(User.id == uid).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.has_completed_onboarding = True
    db.commit()
    return {"ok": True, "has_completed_onboarding": True}
