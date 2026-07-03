# Database Connection and Session Management
# → see ARCHITECTURE.md for data flow
# Manages SQLite connection and provides session dependency for FastAPI

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from models import Base
import config


def _column_exists(connection, table: str, column: str) -> bool:
    columns = connection.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return column in {row[1] for row in columns}


def _migrate_schema(connection) -> None:
    """Lightweight SQLite migrations for existing databases."""
    if not _column_exists(connection, "booking", "exchange_offer"):
        connection.execute(text("ALTER TABLE booking ADD COLUMN exchange_offer TEXT"))
    if not _column_exists(connection, "booking", "intended_use"):
        connection.execute(text("ALTER TABLE booking ADD COLUMN intended_use TEXT"))
    if not _column_exists(connection, "booking", "contract_text"):
        connection.execute(text("ALTER TABLE booking ADD COLUMN contract_text TEXT"))
    if not _column_exists(connection, "booking", "borrower_signed_at"):
        connection.execute(text("ALTER TABLE booking ADD COLUMN borrower_signed_at DATETIME"))
    if not _column_exists(connection, "booking", "owner_signed_at"):
        connection.execute(text("ALTER TABLE booking ADD COLUMN owner_signed_at DATETIME"))
    if not _column_exists(connection, "spaces", "exchange_preferences"):
        connection.execute(text("ALTER TABLE spaces ADD COLUMN exchange_preferences TEXT"))
    if not _column_exists(connection, "spaces", "max_people"):
        connection.execute(text("ALTER TABLE spaces ADD COLUMN max_people INTEGER"))


# Create database engine (SQLite)
engine = create_engine(
    config.DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False},
)

Base.metadata.create_all(bind=engine)

with engine.begin() as connection:
    _migrate_schema(connection)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """
    Dependency function for FastAPI
    Provides a fresh database session for each request
    Automatically closes after request completes
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
