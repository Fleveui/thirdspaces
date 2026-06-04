# Authentication Business Logic Service
# → see DECISIONS.md #4 (Password Hashing with bcrypt)
# → see DECISIONS.md #10 (API Endpoints)
# Handles password hashing, token generation, and user validation

from datetime import datetime, timedelta
from typing import Optional, Tuple
import jwt
import bcrypt
from sqlalchemy.orm import Session
from models import User, AccountType
import config

def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt (max 72 bytes per bcrypt spec)"""
    # Bcrypt has a 72-byte limit - truncate if necessary
    truncated = password[:72].encode('utf-8')
    salt = bcrypt.gensalt(rounds=config.PASSWORD_HASH_ROUNDS)
    return bcrypt.hashpw(truncated, salt).decode('utf-8')

def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check if a plain-text password matches its hash (max 72 bytes per bcrypt spec)"""
    # Bcrypt has a 72-byte limit - truncate if necessary
    truncated = plain_password[:72].encode('utf-8')
    return bcrypt.checkpw(truncated, password_hash.encode('utf-8'))

def create_access_token(user_id: str) -> Tuple[str, datetime]:
    """
    Generate a JWT token for a user session
    
    Returns:
        Tuple of (token, expiration_datetime)
    """
    expires = datetime.utcnow() + timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": user_id,  # subject (user ID)
        "exp": expires,  # expiration time
        "iat": datetime.utcnow()  # issued at
    }
    token = jwt.encode(payload, config.SECRET_KEY, algorithm=config.ALGORITHM)
    return token, expires

def verify_token(token: str) -> Optional[str]:
    """
    Verify JWT token and return user ID if valid
    
    Returns:
        User ID if valid, None if expired or invalid
    """
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        user_id = payload.get("sub")
        return user_id
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def register_user(username: str, email: str, password: str, account_type: str, db: Session) -> Tuple[Optional[User], Optional[str]]:
    """
    Create a new user account
    
    Args:
        username: desired username (must be unique)
        email: user email (must be unique)
        password: plain-text password (will be hashed)
        account_type: 'user' or 'space_owner' (see DECISIONS.md #3)
        db: database session
    
    Returns:
        Tuple of (user_object, error_message)
        If successful: (user, None)
        If failed: (None, error_reason)
    """
    # Validate password length (bcrypt has 72-byte limit)
    if len(password.encode('utf-8')) > 72:
        return None, "Password is too long (maximum 72 bytes)"
    
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == username).first()
    if existing_user:
        return None, f"Username '{username}' already taken"
    
    # Check if email already exists
    existing_email = db.query(User).filter(User.email == email).first()
    if existing_email:
        return None, f"Email '{email}' already in use"
    
    # Validate account type
    try:
        acc_type = AccountType[account_type.upper()]
    except KeyError:
        return None, f"Invalid account type. Must be 'user' or 'space_owner'"
    
    # Create new user with hashed password
    new_user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        account_type=acc_type
    )
    
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user, None
    except Exception as e:
        db.rollback()
        return None, f"Database error: {str(e)}"

def authenticate_user(username: str, password: str, db: Session) -> Tuple[Optional[User], Optional[str]]:
    """
    Verify username and password, return user if valid
    
    Args:
        username: username to authenticate
        password: plain-text password to verify
        db: database session
    
    Returns:
        Tuple of (user_object, error_message)
        If valid: (user, None)
        If invalid: (None, "Invalid username or password")
    """
    # Validate password length (bcrypt has 72-byte limit)
    if len(password.encode('utf-8')) > 72:
        return None, "Invalid username or password"
    
    user = db.query(User).filter(User.username == username).first()
    
    if not user:
        return None, "Invalid username or password"
    
    if not verify_password(password, user.password_hash):
        return None, "Invalid username or password"
    
    return user, None

def get_user_by_id(user_id: str, db: Session) -> Optional[User]:
    """Retrieve a user by ID from the database"""
    return db.query(User).filter(User.id == user_id).first()
