from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from server.config.settings import settings
from server.database import get_db
from server.models.user import User

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()

class RegisterIn(BaseModel):
    email: EmailStr
    password: str
    username: Optional[str] = None

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

def create_access_token(sub: str, minutes: int = None):
    if minutes is None:
        minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    exp = datetime.utcnow() + timedelta(minutes=minutes)
    return jwt.encode({"sub": sub, "exp": exp}, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

@router.post("/register", response_model=TokenOut)
def register(data: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=data.email,
        hashed_password=pwd_ctx.hash(data.password),
        username=data.username,
        is_active=True,
        has_completed_onboarding=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_ctx.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)
