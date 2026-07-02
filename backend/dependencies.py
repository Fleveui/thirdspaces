# Shared FastAPI dependencies for authentication and authorization

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import User, AccountType
from services.auth import verify_token, get_user_by_id


def get_current_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
) -> User:
    """
    Verify JWT token and return the authenticated user.
    Token is extracted from Authorization header: "Bearer <token>"
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format",
        )

    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def get_optional_user(
    authorization: Optional[str] = Header(None), db: Session = Depends(get_db)
) -> Optional[User]:
    """Return the authenticated user if a valid Bearer token is present, else None."""
    if not authorization:
        return None

    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            return None
    except ValueError:
        return None

    user_id = verify_token(token)
    if not user_id:
        return None

    return get_user_by_id(user_id, db)


def require_space_owner(user: User = Depends(get_current_user)) -> User:
    if user.account_type != AccountType.SPACE_OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only space owners can perform this action",
        )
    return user
