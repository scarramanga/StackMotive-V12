from datetime import datetime, timedelta
from typing import Optional
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from email_validator import validate_email, EmailNotValidError
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from server.config.settings import settings
from server.database import get_db
from server.models.user import User

log = logging.getLogger("stackmotive.auth")
pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
router = APIRouter()

class RegisterIn(BaseModel):
    email: str
    password: str
    username: Optional[str] = None

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        v = (v or "").strip().lower()
        if not v:
            raise ValueError("email required")
        relaxed = settings.EMAIL_VALIDATION_MODE == "relaxed"
        log.info(f"[auth] email validator running: mode={settings.EMAIL_VALIDATION_MODE} email={v}")
        try:
            info = validate_email(
                v,
                check_deliverability=not relaxed,
                allow_smtputf8=True
            )
            email = info.normalized
        except EmailNotValidError as e:
            if relaxed and v.rsplit("@", 1)[-1].endswith(".test"):
                email = v
            else:
                raise ValueError(str(e))
        
        domain = email.split("@")[-1]
        if "*" not in settings.ALLOWED_EMAIL_DOMAINS and domain not in settings.ALLOWED_EMAIL_DOMAINS:
            raise ValueError("Email domain not allowed")
        return email

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
        username=(data.username.strip() if data.username else None),
        is_active=True,
        has_completed_onboarding=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)

class LoginIn(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def _validate_email(cls, v: str) -> str:
        v = (v or "").strip().lower()
        relaxed = settings.EMAIL_VALIDATION_MODE == "relaxed"
        try:
            info = validate_email(v, check_deliverability=not relaxed, allow_smtputf8=True)
            return info.normalized
        except EmailNotValidError as e:
            if relaxed and v.rsplit("@", 1)[-1].endswith(".test"):
                return v
            raise ValueError(str(e))

@router.post("/login", response_model=TokenOut)
def login(data: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not pwd_ctx.verify(data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)


compat = APIRouter()

@compat.post("/register", name="compat_register", response_model=TokenOut)
def compat_register(data: RegisterIn, db: Session = Depends(get_db)):
    return register(data, db)

@compat.post("/login", name="compat_login", response_model=TokenOut)
def compat_login(data: LoginIn, db: Session = Depends(get_db)):
    return login(data, db)
