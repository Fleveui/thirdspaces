# Spaces API Routes
# → see DECISIONS.md #10 (API Endpoints)
# HTTP endpoints for viewing and managing spaces
# Called by: frontend (see frontend/src/app/dashboard)

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import List, Optional
from models import Space, User
from database import get_db
from dependencies import require_space_owner
from services.spaces import create_space, list_spaces_by_owner

router = APIRouter(prefix="/api/spaces", tags=["spaces"])

# Request/Response Models (Pydantic schemas)

class CreateSpaceRequest(BaseModel):
    """Incoming request to create a new space listing"""
    name: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    area_m2: float = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    is_outdoor: Optional[bool] = None
    availability: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None
    deposit_needed: Optional[float] = None


class SpaceResponse(BaseModel):
    """Space information for API responses"""
    id: str
    name: str
    owner_id: str
    area_m2: Optional[float] = None
    is_outdoor: Optional[bool] = None
    category: Optional[str] = None
    availability: Optional[str] = None
    deposit_needed: Optional[float] = None
    location: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None

    class Config:
        from_attributes = True


class SpaceListingSummary(BaseModel):
    """Minimal space info for owner dashboard listings"""
    id: str
    name: str
    location: Optional[str] = None

    class Config:
        from_attributes = True

# Endpoints

@router.post("", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
def create_space_endpoint(
    request: CreateSpaceRequest,
    user: User = Depends(require_space_owner),
    db: Session = Depends(get_db),
):
    """
    Create a new space listing.

    Requires: space_owner account with valid JWT token.

    Returns:
        201 with the created space on success; 400 on validation error.
    """
    space, error = create_space(owner_id=user.id, data=request, db=db)

    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    return space


@router.get("/mine", response_model=List[SpaceListingSummary])
def list_my_spaces(
    user: User = Depends(require_space_owner),
    db: Session = Depends(get_db),
):
    """
    Get spaces listed by the authenticated space owner.

    Requires: space_owner account with valid JWT token.

    Returns:
        List of the owner's spaces (id, name, location only).
    """
    return list_spaces_by_owner(owner_id=user.id, db=db)


@router.get("", response_model=List[SpaceResponse])
def list_spaces(db: Session = Depends(get_db)):
    """
    Get all available spaces
    
    Public endpoint - no authentication required
    
    Returns:
        List of all spaces in the database
    """
    spaces = db.query(Space).all()
    return spaces

@router.get("/{space_id}", response_model=SpaceResponse)
def get_space(space_id: str, db: Session = Depends(get_db)):
    """
    Get details of a specific space
    
    Args:
        space_id: ID of the space to retrieve
    
    Returns:
        Space details or 404 if not found
    """
    space = db.query(Space).filter(Space.id == space_id).first()
    
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space {space_id} not found"
        )
    
    return space
