# Spaces Business Logic Service
# Handles space creation, search, and validation

from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session
from models import Booking, Rating, Space, SpacePhoto


def _space_rating_stats(space_id: str, db: Session) -> Tuple[Optional[float], int]:
    """Average borrower visit rating for a space (borrowers rate the stay)."""
    rows = (
        db.query(Rating.rating)
        .join(Booking, Rating.booking_id == Booking.booking_id)
        .filter(
            Booking.space_id == space_id,
            Rating.rater_user_id == Booking.borrower_id,
        )
        .all()
    )
    if not rows:
        return None, 0
    values = [row[0] for row in rows]
    avg = round(sum(values) / len(values), 1)
    return avg, len(values)


def _first_photo_url(space_id: str, db: Session) -> Optional[str]:
    photo = (
        db.query(SpacePhoto)
        .filter(SpacePhoto.space_id == space_id)
        .order_by(SpacePhoto.position.asc().nullslast(), SpacePhoto.created_at.asc())
        .first()
    )
    return photo.image_url if photo else None


def space_to_dict(space: Space, db: Session, include_photos: bool = False) -> dict:
    avg_rating, rating_count = _space_rating_stats(space.id, db)
    data = {
        "id": space.id,
        "name": space.name,
        "owner_id": space.owner_id,
        "area_m2": space.area_m2,
        "is_outdoor": space.is_outdoor,
        "category": space.category,
        "availability": space.availability,
        "location": space.location,
        "description": space.description,
        "rules": space.rules,
        "exchange_preferences": space.exchange_preferences,
        "max_people": space.max_people,
        "image_url": _first_photo_url(space.id, db),
        "avg_rating": avg_rating,
        "rating_count": rating_count,
    }
    if include_photos:
        photos = (
            db.query(SpacePhoto)
            .filter(SpacePhoto.space_id == space.id)
            .order_by(SpacePhoto.position.asc().nullslast(), SpacePhoto.created_at.asc())
            .all()
        )
        data["photos"] = [
            {"photo_id": p.photo_id, "image_url": p.image_url, "position": p.position}
            for p in photos
        ]
    return data


def create_space(
    owner_id: str,
    data,
    db: Session,
) -> Tuple[Optional[Space], Optional[str]]:
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
        exchange_preferences=getattr(data, "exchange_preferences", None),
        max_people=getattr(data, "max_people", None),
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
    return (
        db.query(Space)
        .filter(Space.owner_id == owner_id)
        .order_by(Space.created_at.desc())
        .all()
    )


def search_spaces(
    db: Session,
    category: Optional[str] = None,
    is_outdoor: Optional[bool] = None,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    min_people: Optional[int] = None,
    max_people: Optional[int] = None,
    location: Optional[str] = None,
    availability: Optional[str] = None,
    exclude_owner_id: Optional[str] = None,
) -> List[dict]:
    query = db.query(Space)

    if exclude_owner_id:
        query = query.filter(Space.owner_id != exclude_owner_id)
    if category:
        query = query.filter(Space.category.ilike(f"%{category}%"))
    if is_outdoor is not None:
        query = query.filter(Space.is_outdoor == is_outdoor)
    if min_area is not None:
        query = query.filter(Space.area_m2 >= min_area)
    if max_area is not None:
        query = query.filter(Space.area_m2 <= max_area)
    if min_people is not None:
        query = query.filter(Space.max_people >= min_people)
    if max_people is not None:
        query = query.filter(Space.max_people <= max_people)
    if location:
        query = query.filter(Space.location.ilike(f"%{location}%"))
    if availability:
        query = query.filter(Space.availability.ilike(f"%{availability}%"))

    spaces = query.order_by(Space.created_at.desc()).all()

    if location:
        loc_lower = location.lower()
        spaces.sort(
            key=lambda s: (0 if s.location and loc_lower in s.location.lower() else 1, s.created_at),
            reverse=False,
        )

    return [space_to_dict(space, db) for space in spaces]


def add_space_photo(space_id: str, image_url: str, db: Session, position: Optional[int] = None) -> SpacePhoto:
    photo = SpacePhoto(
        photo_id=uuid.uuid4().hex,
        space_id=space_id,
        image_url=image_url,
        position=position,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo
