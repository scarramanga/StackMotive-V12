from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from server.database import Base
from datetime import datetime

class TradingSignal(Base):
    __tablename__ = "trading_signals"
    
    id = Column(Integer, primary_key=True)
    strategyId = Column(Integer, nullable=False)
    userId = Column(Integer, nullable=False)
    symbol = Column(String(20), nullable=False)
    action = Column(String(20), nullable=False)  # BUY, SELL, DCA, STOP_LOSS
    signalStrength = Column(Numeric)  # 0.0 to 1.0
    technicalIndicators = Column(JSON)
    newsIds = Column(JSON)  # Array of news article IDs
    sentimentIds = Column(JSON)  # Array of sentiment analysis IDs
    status = Column(String(20), default="pending")  # pending, executed, ignored, snoozed, overridden
    snoozeUntil = Column(DateTime)
    overrideJustification = Column(Text)
    overrideBy = Column(Integer)
    overrideAt = Column(DateTime)
    generatedAt = Column(DateTime, default=datetime.utcnow)
    executedAt = Column(DateTime)
    notes = Column(Text)

class RebalanceAction(Base):
    __tablename__ = "rebalance_actions"
    
    id = Column(Integer, primary_key=True)
    userId = Column(Integer, nullable=False)
    recommendationId = Column(Integer, ForeignKey("trading_signals.id"))
    actionType = Column(String(20), nullable=False)  # buy, sell, rebalance
    amount = Column(Numeric, nullable=False)
    executedAt = Column(DateTime)
    oldAllocation = Column(Numeric)
    newAllocation = Column(Numeric)
    status = Column(String(20), default="pending")
    notes = Column(Text)
    createdAt = Column(DateTime, default=datetime.utcnow) 