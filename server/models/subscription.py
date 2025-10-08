from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from server.database import Base


class UserSubscription(Base):
    """User subscription details with Stripe integration"""
    __tablename__ = "user_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    tier = Column(String(50), nullable=False)
    status = Column(String(50), nullable=False)
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_subscription_id = Column(String(255), unique=True, nullable=True)
    current_period_end = Column(Integer, nullable=True)
    grace_until = Column(DateTime(timezone=True), nullable=True)
    last_event_id = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class BillingEvent(Base):
    """Audit trail for all billing webhook events"""
    __tablename__ = "billing_events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(255), unique=True, nullable=False)
    event_type = Column(String(100), nullable=False, index=True)
    payload_hash = Column(String(64), nullable=False)
    status = Column(String(50), nullable=False, default='processed')
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
