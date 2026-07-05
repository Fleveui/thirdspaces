# Bookings Business Logic Service
# Handles listing, creation, status updates, contracts, and ratings

from datetime import datetime
from typing import List, Optional, Tuple
import uuid
from sqlalchemy.orm import Session

from models import Booking, Space, PersonalAccount, Rating, User
from services.auth import get_or_create_personal_account


def _format_borrower_name(borrower: Optional[PersonalAccount]) -> str:
    if not borrower:
        return "Unknown borrower"
    return f"{borrower.name} {borrower.surname}".strip()


def _generate_contract_text(space: Space, booking: Booking) -> str:
    return (
        f"Space Sharing Agreement\n\n"
        f"Space: {space.name}\n"
        f"Location: {space.location or 'Not specified'}\n"
        f"Dates: {booking.start_date.strftime('%Y-%m-%d') if booking.start_date else 'TBD'} to "
        f"{booking.end_date.strftime('%Y-%m-%d') if booking.end_date else 'TBD'}\n\n"
        f"Intended use: {booking.intended_use or 'Not specified'}\n"
        f"Exchange offer: {booking.exchange_offer or 'None'}\n\n"
        f"Rules:\n{space.rules or 'Standard community rules apply.'}\n\n"
        f"Both parties agree to respect the space, follow the rules, and communicate in good faith."
    )


def _booking_row_to_dict(
    booking: Booking,
    space: Space,
    borrower: Optional[PersonalAccount],
    role: str = "owner",
) -> dict:
    data = {
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
        "intended_use": booking.intended_use,
        "contract_text": booking.contract_text,
        "borrower_signed_at": booking.borrower_signed_at,
        "owner_signed_at": booking.owner_signed_at,
        "created_at": booking.created_at,
        "role": role,
        "owner_id": space.owner_id,
    }
    return data


def _owner_bookings_query(owner_id: str, db: Session):
    return (
        db.query(Booking, Space, PersonalAccount)
        .join(Space, Booking.space_id == Space.id)
        .outerjoin(PersonalAccount, Booking.borrower_id == PersonalAccount.id)
        .filter(Space.owner_id == owner_id)
    )


def list_bookings_for_owner(owner_id: str, db: Session) -> List[dict]:
    rows = (
        _owner_bookings_query(owner_id, db)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [_booking_row_to_dict(booking, space, borrower, "owner") for booking, space, borrower in rows]


def list_bookings_for_borrower(borrower_id: str, db: Session) -> List[dict]:
    rows = (
        db.query(Booking, Space, PersonalAccount)
        .join(Space, Booking.space_id == Space.id)
        .outerjoin(PersonalAccount, Booking.borrower_id == PersonalAccount.id)
        .filter(Booking.borrower_id == borrower_id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [_booking_row_to_dict(booking, space, borrower, "borrower") for booking, space, borrower in rows]


def _ensure_approved_contract(booking: Booking, space: Space, db: Session) -> None:
    if booking.status == "approved" and not booking.contract_text:
        booking.contract_text = _generate_contract_text(space, booking)
        db.commit()
        db.refresh(booking)


def get_booking_for_owner(booking_id: str, owner_id: str, db: Session) -> Optional[dict]:
    row = (
        _owner_bookings_query(owner_id, db)
        .filter(Booking.booking_id == booking_id)
        .first()
    )
    if not row:
        return None
    booking, space, borrower = row
    _ensure_approved_contract(booking, space, db)
    return _booking_row_to_dict(booking, space, borrower, "owner")


def get_booking_for_borrower(booking_id: str, borrower_id: str, db: Session) -> Optional[dict]:
    row = (
        db.query(Booking, Space, PersonalAccount)
        .join(Space, Booking.space_id == Space.id)
        .outerjoin(PersonalAccount, Booking.borrower_id == PersonalAccount.id)
        .filter(Booking.booking_id == booking_id, Booking.borrower_id == borrower_id)
        .first()
    )
    if not row:
        return None
    booking, space, borrower = row
    _ensure_approved_contract(booking, space, db)
    return _booking_row_to_dict(booking, space, borrower, "borrower")


def get_booking_for_user(booking_id: str, user_id: str, db: Session) -> Optional[dict]:
    owner_booking = get_booking_for_owner(booking_id, user_id, db)
    if owner_booking:
        return owner_booking
    return get_booking_for_borrower(booking_id, user_id, db)


def create_booking(
    user: User,
    space_id: str,
    start_date: datetime,
    end_date: datetime,
    intended_use: str,
    exchange_offer: Optional[str],
    accepted_terms: bool,
    db: Session,
) -> Tuple[Optional[dict], Optional[str]]:
    if not accepted_terms:
        return None, "You must accept the terms and conditions"

    if end_date <= start_date:
        return None, "End date must be after start date"

    space = db.query(Space).filter(Space.id == space_id).first()
    if not space:
        return None, "Space not found"

    borrower = get_or_create_personal_account(user, db)

    if space.owner_id == user.id:
        return None, "You cannot book your own space"

    booking = Booking(
        booking_id=uuid.uuid4().hex,
        space_id=space_id,
        borrower_id=user.id,
        start_date=start_date,
        end_date=end_date,
        intended_use=intended_use.strip(),
        exchange_offer=exchange_offer.strip() if exchange_offer else None,
        status="pending",
    )

    try:
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return _booking_row_to_dict(booking, space, borrower, "borrower"), None
    except Exception as e:
        db.rollback()
        return None, f"Database error: {str(e)}"


def update_booking_status(
    booking_id: str,
    owner_id: str,
    new_status: str,
    db: Session,
) -> Tuple[Optional[dict], Optional[str]]:
    row = (
        db.query(Booking, Space)
        .join(Space, Booking.space_id == Space.id)
        .filter(Booking.booking_id == booking_id, Space.owner_id == owner_id)
        .first()
    )

    if not row:
        return None, "Booking not found"

    booking, space = row

    if booking.status != "pending":
        return None, "Only pending bookings can be updated"

    if new_status not in ("approved", "rejected"):
        return None, "Invalid status"

    booking.status = new_status
    if new_status == "approved":
        booking.contract_text = _generate_contract_text(space, booking)

    try:
        db.commit()
        db.refresh(booking)
        return get_booking_for_owner(booking_id, owner_id, db), None
    except Exception as e:
        db.rollback()
        return None, f"Database error: {str(e)}"


def sign_booking_contract(
    booking_id: str,
    user_id: str,
    db: Session,
) -> Tuple[Optional[dict], Optional[str]]:
    row = (
        db.query(Booking, Space)
        .join(Space, Booking.space_id == Space.id)
        .filter(Booking.booking_id == booking_id)
        .first()
    )
    if not row:
        return None, "Booking not found"

    booking, space = row

    if booking.status != "approved":
        return None, "Only approved bookings can be signed"

    if not booking.contract_text:
        booking.contract_text = _generate_contract_text(space, booking)

    now = datetime.utcnow()
    if user_id == booking.borrower_id:
        booking.borrower_signed_at = now
    elif user_id == space.owner_id:
        booking.owner_signed_at = now
    else:
        return None, "You are not a party to this booking"

    try:
        db.commit()
        db.refresh(booking)
        return get_booking_for_user(booking_id, user_id, db), None
    except Exception as e:
        db.rollback()
        return None, f"Database error: {str(e)}"


def rate_booking(
    booking_id: str,
    rater_user_id: str,
    rating_value: int,
    comment: Optional[str],
    db: Session,
) -> Tuple[Optional[dict], Optional[str]]:
    if rating_value < 1 or rating_value > 5:
        return None, "Rating must be between 1 and 5"

    row = (
        db.query(Booking, Space)
        .join(Space, Booking.space_id == Space.id)
        .filter(Booking.booking_id == booking_id)
        .first()
    )
    if not row:
        return None, "Booking not found"

    booking, space = row

    if booking.status != "approved":
        return None, "Only approved bookings can be rated"

    if not booking.borrower_signed_at or not booking.owner_signed_at:
        return None, "Both parties must sign the contract before rating"

    if booking.end_date and booking.end_date > datetime.utcnow():
        return None, "You can rate after the visit has ended"

    if rater_user_id not in (booking.borrower_id, space.owner_id):
        return None, "You are not a party to this booking"

    existing = (
        db.query(Rating)
        .filter(Rating.booking_id == booking_id, Rating.rater_user_id == rater_user_id)
        .first()
    )
    if existing:
        return None, "You have already rated this booking"

    rating = Rating(
        id=uuid.uuid4().hex,
        booking_id=booking_id,
        rater_user_id=rater_user_id,
        rating=rating_value,
        comment=comment,
    )

    try:
        db.add(rating)
        db.commit()
        return {"message": "Rating submitted", "rating": rating_value}, None
    except Exception as e:
        db.rollback()
        return None, f"Database error: {str(e)}"
