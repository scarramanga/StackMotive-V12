raise RuntimeError("\u26d4 This script is deprecated. Use `create_tables.py` to initialize the database properly.")

from server.database import Base, engine
from server.models.user import User  # Import all models here

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db() 