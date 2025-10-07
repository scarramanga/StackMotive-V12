from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Response, Cookie
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from server.database import get_db
from server.models.user import User
import logging
import uuid

from server.config.env import (
    AUTH_SECRET_KEY,
    AUTH_REFRESH_SECRET,
    AUTH_ALGO,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

SECRET_KEY = AUTH_SECRET_KEY
REFRESH_SECRET_KEY = AUTH_REFRESH_SECRET
ALGORITHM = AUTH_ALGO

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token - ensure tokenUrl matches the actual endpoint
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/login",
    scheme_name="bearerAuth",  # Match the security scheme name in OpenAPI
    description="JWT token authentication"
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token with JTI."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "jti": str(uuid.uuid4()),
        "type": "access"
    })
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token with JTI."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "jti": str(uuid.uuid4())
    })
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_tokens(email: str) -> Tuple[str, str]:
    """Create both access and refresh tokens."""
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": email},
        expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token({"sub": email})
    return access_token, refresh_token

def is_token_revoked(jti: str, db: Session) -> bool:
    """Check if a token JTI is in the revoked tokens table."""
    from server.models.revoked_token import RevokedToken
    
    revoked = db.query(RevokedToken).filter(RevokedToken.jti == jti).first()
    return revoked is not None


def revoke_token(jti: str, token_type: str, user_id: int, expires_at: datetime, db: Session) -> None:
    """Add a token to the revoked tokens table."""
    from server.models.revoked_token import RevokedToken
    
    if is_token_revoked(jti, db):
        return
    
    revoked_token = RevokedToken(
        jti=jti,
        token_type=token_type,
        user_id=user_id,
        expires_at=expires_at
    )
    db.add(revoked_token)
    db.commit()


def verify_refresh_token(token: str, db: Optional[Session] = None) -> Optional[str]:
    """Verify refresh token and return email if valid."""
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        token_type = payload.get("type")
        jti = payload.get("jti")
        
        if email is None or token_type != "refresh":
            return None
        
        if db and jti and is_token_revoked(jti, db):
            return None
            
        return email
    except JWTError:
        return None

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    logger.debug(f"🔑 Validating token: {token[:10]}...")
    
    try:
        # Decode JWT token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            logger.warning("❌ No email in token payload")
            raise credentials_exception
            
        logger.debug(f"🔍 Decoded email from token: {email}")
        
    except JWTError as e:
        logger.error(f"❌ JWT validation error: {str(e)}")
        raise credentials_exception
        
    # Get user by email
    user = db.query(User).filter(User.email == email).first()
    logger.debug(f"✅ DB user found: {user}")
    
    if user is None:
        logger.warning(f"❌ No user found for email: {email}")
        raise credentials_exception
        
    return user

def set_refresh_token_cookie(response: Response, refresh_token: str):
    """Set refresh token in HttpOnly cookie."""
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # Only send over HTTPS
        samesite="lax",
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,  # in seconds
        path="/api"  # Only send for API routes
    )

