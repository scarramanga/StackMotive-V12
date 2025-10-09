from sqlalchemy import Column, String, DateTime, Integer, Boolean
from server.database import Base
from datetime import datetime

class MagicLinkToken(Base):
    __tablename__ = "magic_link_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    token = Column(String, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    used = Column(Boolean, default=False)
