from sqlalchemy import Column, String, Boolean, DateTime, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from server.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String(64), nullable=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)  # Admin flag
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # New fields for onboarding and preferences
    has_completed_onboarding = Column(Boolean, default=False)
    onboarding_completed_at = Column(DateTime(timezone=True), nullable=True)
    onboarding_step = Column(Integer, default=1)  # Track current onboarding step
    preferred_currency = Column(String, default='USD')
    
    subscription_tier = Column(String, default='observer')
    preview_tier = Column(String, nullable=True)
    preview_expires_at = Column(DateTime(timezone=True), nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    
    # Relationships
    paper_trading_accounts = relationship("PaperTradingAccount", back_populates="user", cascade="all, delete-orphan")
