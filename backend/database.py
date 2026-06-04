# Database Connection and Session Management
# → see ARCHITECTURE.md for data flow
# Manages SQLite connection and provides session dependency for FastAPI

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base
import config

# Create database engine (SQLite)
engine = create_engine(
    config.DATABASE_URL,
    echo=False,  # Set to True for SQL debugging
    connect_args={"check_same_thread": False}  # Required for SQLite + threading
)

# Create all tables if they don't exist
Base.metadata.create_all(bind=engine)

# Session factory for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db() -> Session:
    """
    Dependency function for FastAPI
    Provides a fresh database session for each request
    Automatically closes after request completes
    
    Usage in routes:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
