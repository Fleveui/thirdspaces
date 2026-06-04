# Authentication API Routes
# → see DECISIONS.md #10 (API Endpoints)
# HTTP endpoints for login, registration, and session management
# Called by: frontend (see frontend/src/app/login and frontend/src/app/register)

from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from typing import Optional
from services.auth import (
    register_user, 
    authenticate_user, 
    create_access_token,
    verify_token,
    get_user_by_id
)
from models import User
from database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Request/Response Models (Pydantic schemas)

class RegisterRequest(BaseModel):
    """Incoming registration request from frontend"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    account_type: str = Field(..., pattern="^(user|space_owner)$")

class RegisterResponse(BaseModel):
    """Response after successful registration"""
    id: str
    username: str
    email: str
    account_type: str
    message: str = "Account created successfully!"

class LoginRequest(BaseModel):
    """Incoming login request from frontend"""
    username: str
    password: str

class LoginResponse(BaseModel):
    """Response after successful login"""
    token: str
    user: dict
    message: str = "You're successfully logged in!"

class UserResponse(BaseModel):
    """Current user information"""
    id: str
    username: str
    email: str
    account_type: str

class ErrorResponse(BaseModel):
    """Error response"""
    error: str

# Dependency: extract and verify JWT token from request header
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    """
    Verify JWT token and return the authenticated user
    Used by protected endpoints to ensure user is logged in
    
    Token is extracted from Authorization header: "Bearer <token>"
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token"
        )
    
    # Extract token from "Bearer <token>" format
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise ValueError
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format"
        )
    
    user_id = verify_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user = get_user_by_id(user_id, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

# Routes

@router.post("/register", response_model=RegisterResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """
    Register a new user account
    
    Accepts:
    - username: 3-50 characters
    - email: valid email
    - password: minimum 6 characters
    - account_type: 'user' or 'space_owner'
    
    Returns: new user object with ID
    Errors: 400 if validation fails, 409 if username/email exists
    """
    user, error = register_user(
        username=request.username,
        email=request.email,
        password=request.password,
        account_type=request.account_type,
        db=db
    )
    
    if error:
        # 409 Conflict if username/email already exists
        # 400 Bad Request for other validation errors
        status_code = status.HTTP_409_CONFLICT if "already" in error else status.HTTP_400_BAD_REQUEST
        raise HTTPException(status_code=status_code, detail=error)
    
    return RegisterResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        account_type=user.account_type.value
    )

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Log in with username and password
    
    Returns: JWT token and user information
    On success: redirect frontend to /dashboard
    On failure: prompt to create account (see app-requirements.md)
    """
    user, error = authenticate_user(request.username, request.password, db)
    
    if error:
        # 401 Unauthorized — send to registration
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=error)
    
    # Create JWT token for this session
    token, _ = create_access_token(user.id)
    
    return LoginResponse(
        token=token,
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "account_type": user.account_type.value
        }
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_info(user: User = Depends(get_current_user)):
    """
    Get information about the currently logged-in user
    Requires: valid JWT token in Authorization header (Bearer <token>)
    
    Returns: user object
    Used by: frontend to verify session after page refresh (see DECISIONS.md #5)
    """
    return UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        account_type=user.account_type.value
    )

@router.post("/logout")
def logout():
    """
    Log out the current user
    Note: JWT tokens are stateless, so logout is a frontend operation
    (frontend deletes token from localStorage)
    This endpoint exists for future use (e.g., token blacklisting)
    """
    return {"message": "Logged out successfully"}
