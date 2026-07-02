# Database Models for Community Space Sharing Platform
# → see DECISIONS.md #9 (Database Schema) and #12 (Excel Import)
# Defines all database tables using SQLAlchemy ORM
# 
# Tables:
#   - users: authentication (login/register) for both account types
#   - personal_account: individual users looking for spaces
#   - business_account: space owners (companies/organizations)
#   - space: available spaces for booking
#   - booking: booking requests and their status
#   - space_photo: photos/images of spaces

from sqlalchemy import Column, String, DateTime, Enum as SQLEnum, Float, Integer, Boolean, create_engine, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from enum import Enum
import config

Base = declarative_base()

class AccountType(str, Enum):
    """Account type enumeration"""
    USER = "user"
    SPACE_OWNER = "space_owner"

class User(Base):
    """
    User model: stores login credentials and account metadata
    Used for authentication (login/register) for both personal and business accounts
    """
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True, default=lambda: __import__('uuid').uuid4().hex)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    account_type = Column(SQLEnum(AccountType), default=AccountType.USER, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<User {self.username} ({self.account_type})>"


class Space(Base):
    """Space model: represents available spaces for booking"""
    __tablename__ = "spaces"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True)
    name = Column(String(255), nullable=False, index=True)
    owner_id = Column(String, nullable=False, index=True)
    area_m2 = Column(Float, nullable=True)
    is_outdoor = Column(Boolean, nullable=True)
    category = Column(String(100), nullable=True)
    availability = Column(String(100), nullable=True)
    deposit_needed = Column(Float, nullable=True)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    rules = Column(Text, nullable=True)
    exchange_preferences = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Space {self.name}>"


class PersonalAccount(Base):
    """PersonalAccount model: individual users (borrowers)"""
    __tablename__ = "personal_account"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    surname = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<PersonalAccount {self.name} {self.surname}>"


class BusinessAccount(Base):
    """BusinessAccount model: space owners (companies/organizations)"""
    __tablename__ = "business_account"
    __table_args__ = {'extend_existing': True}
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    surname = Column(String(100), nullable=False)
    company = Column(String(255), nullable=False)
    company_email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<BusinessAccount {self.company}>"


class Booking(Base):
    """Booking model: space booking requests"""
    __tablename__ = "booking"
    __table_args__ = {'extend_existing': True}
    
    booking_id = Column(String, primary_key=True)
    space_id = Column(String, nullable=False, index=True)
    borrower_id = Column(String, nullable=False, index=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(50), default="pending", nullable=False)
    exchange_offer = Column(Text, nullable=True)
    intended_use = Column(Text, nullable=True)
    contract_text = Column(Text, nullable=True)
    borrower_signed_at = Column(DateTime, nullable=True)
    owner_signed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<Booking {self.booking_id}>"


class SpacePhoto(Base):
    """SpacePhoto model: photos and images for spaces"""
    __tablename__ = "space_photo"
    __table_args__ = {'extend_existing': True}
    
    photo_id = Column(String, primary_key=True)
    space_id = Column(String, nullable=False, index=True)
    image_url = Column(Text, nullable=True)
    position = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    def __repr__(self):
        return f"<SpacePhoto {self.photo_id}>"


class Conversation(Base):
    """Chat conversation tied to an approved booking."""
    __tablename__ = "conversation"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: __import__('uuid').uuid4().hex)
    booking_id = Column(String, nullable=False, unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Message(Base):
    """Chat message within a conversation."""
    __tablename__ = "message"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: __import__('uuid').uuid4().hex)
    conversation_id = Column(String, nullable=False, index=True)
    sender_user_id = Column(String, nullable=False, index=True)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Rating(Base):
    """Post-visit rating from one party about the other."""
    __tablename__ = "rating"
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, default=lambda: __import__('uuid').uuid4().hex)
    booking_id = Column(String, nullable=False, index=True)
    rater_user_id = Column(String, nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


def init_db():
    """Create all tables in the database"""
    engine = create_engine(config.DATABASE_URL, echo=False)
    Base.metadata.create_all(bind=engine)
    return engine

def get_session_factory(engine):
    """Create a session factory for database operations"""
    return sessionmaker(bind=engine, expire_on_commit=False)
