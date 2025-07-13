from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from server.database import Base

class PaperTradingAccount(Base):
    __tablename__ = "paper_trading_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    name = Column(String, default="My Paper Trading Account")
    initial_balance = Column(Float, default=100000.0)
    current_balance = Column(Float, default=100000.0)
    currency = Column(String, default="USD")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Strategy fields
    strategy_name = Column(String, nullable=True)
    last_strategy_run_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship back to user
    user = relationship("User", back_populates="paper_trading_accounts")

class Trade(Base):
    __tablename__ = "paper_trades"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("paper_trading_accounts.id", ondelete="CASCADE"))
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)  # 'buy' or 'sell'
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    order_type = Column(String, default="market")
    status = Column(String, default="pending")
    executed_at = Column(String, nullable=True)
    created_at = Column(String, nullable=True)

    # Relationship back to account
    account = relationship("PaperTradingAccount") 