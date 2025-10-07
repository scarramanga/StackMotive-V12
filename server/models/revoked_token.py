from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from server.database import Base

class RevokedToken(Base):
    __tablename__ = "revoked_tokens"
    
    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String(36), unique=True, index=True, nullable=False)
    token_type = Column(String(20), nullable=False)
    user_id = Column(Integer, nullable=False, index=True)
    revoked_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    def __repr__(self):
        return f"<RevokedToken(jti={self.jti}, type={self.token_type}, user_id={self.user_id})>"
