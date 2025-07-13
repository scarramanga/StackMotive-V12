# Block 24: Vault Integration (Obsidian)
# Placeholder model for sovereign asset vault entries
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
import uuid
import datetime

Base = declarative_base()

class SovereignVaultEntry(Base):
    __tablename__ = 'sovereign_vault_entries'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String, nullable=False)
    asset = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    notes = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    # TODO: Add fields for Obsidian/local markdown sync metadata
    # TODO: Implement import/sync logic 