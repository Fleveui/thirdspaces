# Spaces API Routes
# → see DECISIONS.md #10 (API Endpoints)
# HTTP endpoints for viewing and managing spaces
# Called by: frontend (see frontend/src/app/dashboard)

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
from models import Space
from database import get_db

router = APIRouter(prefix="/api/spaces", tags=["spaces"])

# Request/Response Models (Pydantic schemas)

class SpaceResponse(BaseModel):
    """Space information for API responses"""
    id: str
    name: str
    owner_id: str
    area_m2: float
    is_outdoor: bool
    category: str
    availability: str
    deposit_needed: float
    location: str
    
    class Config:
        from_attributes = True

# Endpoints

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
