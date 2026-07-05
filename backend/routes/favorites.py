# Favorites API Routes — saved spaces for Find mode

from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from routes.spaces import SpaceResponse
from services.favorites import add_favorite, is_favorited, list_favorites, remove_favorite

router = APIRouter(prefix="/api/favorites", tags=["favorites"])


class FavoriteStatusResponse(BaseModel):
    favorited: bool


@router.get("", response_model=List[SpaceResponse])
def get_favorites(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_favorites(user_id=user.id, db=db)


@router.get("/{space_id}", response_model=FavoriteStatusResponse)
def get_favorite_status(
    space_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return FavoriteStatusResponse(favorited=is_favorited(user.id, space_id, db))


@router.post("/{space_id}", response_model=FavoriteStatusResponse, status_code=status.HTTP_201_CREATED)
def save_favorite(
    space_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _, error = add_favorite(user_id=user.id, space_id=space_id, db=db)
    if error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error,
        )
    return FavoriteStatusResponse(favorited=True)


@router.delete("/{space_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_favorite(
    space_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    error = remove_favorite(user_id=user.id, space_id=space_id, db=db)
    if error:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=error,
        )
