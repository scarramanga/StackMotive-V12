from datetime import datetime, timedelta
from typing import Optional
import logging
import secrets
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

def create_access_token(sub: str, minutes: Optional[int] = None):
    """Create JWT access token with issuer and audience claims"""
    from server.config.production_auth import get_jwt_secret, get_jwt_issuer, get_jwt_audience
    import uuid
    
    if minutes is None:
        minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
    exp = datetime.utcnow() + timedelta(minutes=minutes)
    
    payload = {
        "sub": sub,
        "exp": exp,
        "iss": get_jwt_issuer(),
        "aud": get_jwt_audience(),
        "jti": str(uuid.uuid4()),
        "type": "access"
    }
    
    jwt_secret = get_jwt_secret()
    return jwt.encode(payload, jwt_secret, algorithm=settings.JWT_ALGORITHM)

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

class MagicLinkRequest(BaseModel):
    email: str

@router.post("/magic-link/request")
def request_magic_link(data: MagicLinkRequest, db: Session = Depends(get_db)):
    """Request a magic link for passwordless login"""
    from server.models.magic_link import MagicLinkToken
    from server.services.email_service import send_magic_link_email
    
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        return {"success": True, "message": "If the email exists, a magic link has been sent"}
    
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=15)
    
    magic_link = MagicLinkToken(
        email=data.email,
        token=token,
        expires_at=expires_at,
        used=False
    )
    db.add(magic_link)
    db.commit()
    
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    magic_link_url = f"{frontend_url}/login/magic?token={token}"
    send_magic_link_email(data.email, magic_link_url)
    
    return {"success": True, "message": "Magic link sent to your email"}

@router.post("/magic-link/verify")
def verify_magic_link(token: str, db: Session = Depends(get_db)):
    """Verify magic link token and log user in"""
    from server.models.magic_link import MagicLinkToken
    
    magic_link = db.query(MagicLinkToken).filter(
        MagicLinkToken.token == token,
        MagicLinkToken.used == False
    ).first()
    
    if not magic_link:
        raise HTTPException(status_code=400, detail="Invalid or expired magic link")
    
    if datetime.utcnow() > magic_link.expires_at:
        raise HTTPException(status_code=400, detail="Magic link has expired")
    
    magic_link.used = True
    db.commit()
    
    user = db.query(User).filter(User.email == magic_link.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    access_token = create_access_token(str(user.id))
    
    return TokenOut(access_token=access_token)

compat = APIRouter()

@compat.post("/register", name="compat_register", response_model=TokenOut)
def compat_register(data: RegisterIn, db: Session = Depends(get_db)):
    return register(data, db)

@compat.post("/login", name="compat_login", response_model=TokenOut)
def compat_login(data: LoginIn, db: Session = Depends(get_db)):
    return login(data, db)
