# Favorites business logic — saved spaces for Find mode

from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from models import Space, SpaceFavorite
from services.spaces import space_to_dict


def list_favorites(user_id: str, db: Session) -> List[dict]:
    favorites = (
        db.query(SpaceFavorite)
        .filter(SpaceFavorite.user_id == user_id)
        .order_by(SpaceFavorite.created_at.desc())
        .all()
    )
    result = []
    for fav in favorites:
        space = db.query(Space).filter(Space.id == fav.space_id).first()
        if space:
            result.append(space_to_dict(space, db))
    return result


def is_favorited(user_id: str, space_id: str, db: Session) -> bool:
    return (
        db.query(SpaceFavorite)
        .filter(SpaceFavorite.user_id == user_id, SpaceFavorite.space_id == space_id)
        .first()
        is not None
    )


def add_favorite(user_id: str, space_id: str, db: Session) -> Tuple[Optional[dict], Optional[str]]:
    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        return None, "Space not found"

    existing = (
        db.query(SpaceFavorite)
        .filter(SpaceFavorite.user_id == user_id, SpaceFavorite.space_id == space_id)
        .first()
    )
    if not existing:
        db.add(SpaceFavorite(user_id=user_id, space_id=space_id))
        db.commit()

    return {"favorited": True, "space_id": space_id}, None


def remove_favorite(user_id: str, space_id: str, db: Session) -> Optional[str]:
    favorite = (
        db.query(SpaceFavorite)
        .filter(SpaceFavorite.user_id == user_id, SpaceFavorite.space_id == space_id)
        .first()
    )
    if not favorite:
        return "Favorite not found"

    db.delete(favorite)
    db.commit()
    return None
