from sqlalchemy import create_engine, text as sql
from sqlalchemy.orm import sessionmaker
import os

engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_session():
    return SessionLocal()
