# Bookings Business Logic Service
# Handles listing and status updates for space owner booking requests

from typing import List, Optional, Tuple
from sqlalchemy.orm import Session

from models import Booking, Space, PersonalAccount


def _format_borrower_name(borrower: Optional[PersonalAccount]) -> str:
    if not borrower:
        return "Unknown borrower"
    return f"{borrower.name} {borrower.surname}".strip()


def _booking_row_to_dict(booking: Booking, space: Space, borrower: Optional[PersonalAccount]) -> dict:
    return {
        "booking_id": booking.booking_id,
        "space_id": booking.space_id,
        "space_name": space.name,
        "space_location": space.location,
        "borrower_name": _format_borrower_name(borrower),
        "borrower_email": borrower.email if borrower else None,
        "start_date": booking.start_date,
        "end_date": booking.end_date,
        "status": booking.status,
        "exchange_offer": booking.exchange_offer,
        "created_at": booking.created_at,
    }


def _owner_bookings_query(owner_id: str, db: Session):
    return (
        db.query(Booking, Space, PersonalAccount)
        .join(Space, Booking.space_id == Space.id)
        .outerjoin(PersonalAccount, Booking.borrower_id == PersonalAccount.id)
        .filter(Space.owner_id == owner_id)
    )


def list_bookings_for_owner(owner_id: str, db: Session) -> List[dict]:
    """Return all bookings for spaces owned by the given user."""
    rows = (
        _owner_bookings_query(owner_id, db)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [_booking_row_to_dict(booking, space, borrower) for booking, space, borrower in rows]


def get_booking_for_owner(booking_id: str, owner_id: str, db: Session) -> Optional[dict]:
    """Return a single booking if it belongs to one of the owner's spaces."""
    row = (
        _owner_bookings_query(owner_id, db)
        .filter(Booking.booking_id == booking_id)
        .first()
    )
    if not row:
        return None
    booking, space, borrower = row
    return _booking_row_to_dict(booking, space, borrower)


def update_booking_status(
    booking_id: str,
    owner_id: str,
    new_status: str,
    db: Session,
) -> Tuple[Optional[dict], Optional[str]]:
    """
    Update booking status if pending and owned by the user.

    Returns:
        Tuple of (booking_dict, error_message)
    """
    row = (
        db.query(Booking, Space)
        .join(Space, Booking.space_id == Space.id)
        .filter(Booking.booking_id == booking_id, Space.owner_id == owner_id)
        .first()
    )

    if not row:
        return None, "Booking not found"

    booking, _space = row

    if booking.status != "pending":
        return None, "Only pending bookings can be updated"

    if new_status not in ("approved", "rejected"):
        return None, "Invalid status"

    booking.status = new_status

    try:
        db.commit()
        db.refresh(booking)
        return get_booking_for_owner(booking_id, owner_id, db), None
    except Exception as e:
        db.rollback()
        return None, f"Database error: {str(e)}"
