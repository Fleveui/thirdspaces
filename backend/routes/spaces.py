# Spaces API Routes
# HTTP endpoints for viewing and managing spaces

import os
import uuid
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Space, User
from services.spaces import (
    add_space_photo,
    create_space,
    list_spaces_by_owner,
    search_spaces,
    space_to_dict,
)

router = APIRouter(prefix="/api/spaces", tags=["spaces"])

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


class CreateSpaceRequest(BaseModel):
    name: str = Field(..., min_length=1)
    location: str = Field(..., min_length=1)
    area_m2: float = Field(..., gt=0)
    category: str = Field(..., min_length=1)
    is_outdoor: Optional[bool] = None
    availability: Optional[str] = None
    description: Optional[str] = None
    rules: Optional[str] = None
    deposit_needed: Optional[float] = None
    exchange_preferences: Optional[str] = None


class SpacePhotoItem(BaseModel):
    photo_id: str
    image_url: Optional[str] = None
    position: Optional[int] = None


class SpaceResponse(BaseModel):
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
    exchange_preferences: Optional[str] = None
    image_url: Optional[str] = None
    photos: Optional[List[SpacePhotoItem]] = None

    class Config:
        from_attributes = True


class SpaceListingSummary(BaseModel):
    id: str
    name: str
    location: Optional[str] = None

    class Config:
        from_attributes = True


@router.post("", response_model=SpaceResponse, status_code=status.HTTP_201_CREATED)
def create_space_endpoint(
    request: CreateSpaceRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    space, error = create_space(owner_id=user.id, data=request, db=db)
    if error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    return space_to_dict(space, db)


@router.get("/mine", response_model=List[SpaceListingSummary])
def list_my_spaces(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_spaces_by_owner(owner_id=user.id, db=db)


@router.get("", response_model=List[SpaceResponse])
def list_spaces(
    category: Optional[str] = None,
    is_outdoor: Optional[bool] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    location: Optional[str] = None,
    availability: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return search_spaces(
        db=db,
        category=category,
        is_outdoor=is_outdoor,
        min_area=min_area,
        max_area=max_area,
        location=location,
        availability=availability,
    )


@router.get("/{space_id}", response_model=SpaceResponse)
def get_space(space_id: str, db: Session = Depends(get_db)):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Space {space_id} not found",
        )
    return space_to_dict(space, db, include_photos=True)


@router.post("/{space_id}/photos", status_code=status.HTTP_201_CREATED)
async def upload_space_photo(
    space_id: str,
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Space not found")
    if space.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your space")

    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid image type")

    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = UPLOAD_DIR / filename
    content = await file.read()
    filepath.write_bytes(content)

    image_url = f"/uploads/{filename}"
    photo = add_space_photo(space_id=space_id, image_url=image_url, db=db)
    return {"photo_id": photo.photo_id, "image_url": image_url}
