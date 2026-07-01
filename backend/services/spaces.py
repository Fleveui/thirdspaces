# Spaces Business Logic Service
# Handles space creation and validation

from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session
from models import Space


def create_space(
    owner_id: str,
    data,
    db: Session,
) -> Tuple[Optional[Space], Optional[str]]:
    """
    Create a new space listing for a space owner.

    Args:
        owner_id: ID of the authenticated user (space owner)
        data: object with space fields (name, location, area_m2, category, etc.)
        db: database session

    Returns:
        Tuple of (space_object, error_message)
        If successful: (space, None)
        If failed: (None, error_reason)
    """
    name = getattr(data, "name", None)
    location = getattr(data, "location", None)
    area_m2 = getattr(data, "area_m2", None)
    category = getattr(data, "category", None)

    if not name or not name.strip():
        return None, "Name is required"
    if not location or not location.strip():
        return None, "Location is required"
    if area_m2 is None or area_m2 <= 0:
        return None, "Area must be greater than 0"
    if not category or not category.strip():
        return None, "Category is required"

    new_space = Space(
        id=uuid.uuid4().hex,
        owner_id=owner_id,
        name=name.strip(),
        location=location.strip(),
        area_m2=area_m2,
        category=category.strip(),
        is_outdoor=getattr(data, "is_outdoor", None),
        availability=getattr(data, "availability", None),
        description=getattr(data, "description", None),
        rules=getattr(data, "rules", None),
        deposit_needed=getattr(data, "deposit_needed", None),
    )

    try:
        db.add(new_space)
        db.commit()
        db.refresh(new_space)
        return new_space, None
    except Exception as e:
        db.rollback()
        return None, f"Database error: {str(e)}"


def list_spaces_by_owner(owner_id: str, db: Session) -> List[Space]:
    """Return all spaces owned by the given user."""
    return (
        db.query(Space)
        .filter(Space.owner_id == owner_id)
        .order_by(Space.created_at.desc())
        .all()
    )
