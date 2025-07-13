from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from pathlib import Path

# Canonical database location: dev.db at project root
# All modules (FastAPI, Prisma, CLI, tests) must use this same database
DATABASE_URL = f"sqlite:///{Path(__file__).resolve().parent.parent / 'dev.db'}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 