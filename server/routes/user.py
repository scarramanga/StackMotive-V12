from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

from server.database import get_db
from server.models.user import User
from server.auth import (
    verify_password,
    get_password_hash,
    create_tokens,
    get_current_user,
    set_refresh_token_cookie,
    verify_refresh_token,
    create_access_token
)

router = APIRouter()


class Token(BaseModel):
    access_token: str
    token_type: str
    

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str] = None
    subscription_tier: str = "observer"
    
    class Config:
        from_attributes = True


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str
    full_name: Optional[str] = None


@router.post("/register", response_model=dict)
async def register(user_data: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        password_hash=hashed_password,
        username=user_data.username,
        full_name=user_data.full_name,
        subscription_tier="observer",
        created_at=datetime.utcnow(),
        last_login=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token, refresh_token = create_tokens(new_user.email)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(new_user)
    }


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login endpoint"""
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    access_token, refresh_token = create_tokens(user.email)
    
    set_refresh_token_cookie(response, refresh_token)
    
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return UserResponse.from_orm(current_user)


@router.post("/refresh-token", response_model=Token)
async def refresh_token(
    response: Response,
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    email = verify_refresh_token(refresh_token)
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    access_token, new_refresh_token = create_tokens(email)
    
    set_refresh_token_cookie(response, new_refresh_token)
    
    return Token(access_token=access_token, token_type="bearer")
