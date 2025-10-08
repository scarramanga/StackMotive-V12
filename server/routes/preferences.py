from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from server.database import get_db
from jose import jwt
from server.config.settings import settings
from fastapi.security import HTTPBearer

router = APIRouter()
auth = HTTPBearer()

def uid_from(token: str):
    payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    return payload.get("sub")

class Prefs(BaseModel):
    theme: str = "dark"
    timezone: str = "Pacific/Auckland"
    notifications_enabled: bool = True

@router.get("/user-preferences", response_model=Prefs)
def get_prefs(token=Depends(auth), db: Session = Depends(get_db)):
    try:
        uid = int(uid_from(token.credentials))
    except:
        return Prefs()
    return Prefs()

@router.put("/user-preferences", response_model=Prefs)
def set_prefs(data: Prefs, token=Depends(auth), db: Session = Depends(get_db)):
    try:
        uid = int(uid_from(token.credentials))
    except:
        raise HTTPException(status_code=401, detail="Invalid token")
    return data
