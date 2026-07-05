# Chat Business Logic Service
# Booking-scoped conversations between borrower and space owner

from datetime import datetime
from typing import List, Optional, Tuple
import uuid

from sqlalchemy.orm import Session

from models import Booking, Conversation, Message, PersonalAccount, Space, User


def booking_is_chat_eligible(booking: Booking) -> bool:
    return booking.status == "approved"


def user_can_access_booking(user_id: str, booking: Booking, space: Space) -> bool:
    return user_id in (booking.borrower_id, space.owner_id)


def get_or_create_conversation(booking_id: str, db: Session) -> Conversation:
    conversation = db.query(Conversation).filter(Conversation.booking_id == booking_id).first()
    if conversation:
        return conversation
    conversation = Conversation(id=uuid.uuid4().hex, booking_id=booking_id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def _format_borrower_name(borrower: Optional[PersonalAccount]) -> str:
    if not borrower:
        return "Unknown borrower"
    return f"{borrower.name} {borrower.surname}".strip()


def _other_party(user_id: str, booking: Booking, space: Space, db: Session) -> Tuple[str, str]:
    if user_id == space.owner_id:
        borrower = db.query(PersonalAccount).filter(PersonalAccount.id == booking.borrower_id).first()
        return _format_borrower_name(borrower), "borrower"
    owner = db.query(User).filter(User.id == space.owner_id).first()
    return (owner.username if owner else "Space owner"), "owner"


def _last_message(conversation_id: str, db: Session) -> Optional[Message]:
    return (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.desc())
        .first()
    )


def list_conversations_for_user(user_id: str, db: Session) -> List[dict]:
    rows = db.query(Booking, Space).join(Space, Booking.space_id == Space.id).all()
    result = []
    for booking, space in rows:
        if not user_can_access_booking(user_id, booking, space):
            continue
        if not booking_is_chat_eligible(booking):
            continue
        conversation = get_or_create_conversation(booking.booking_id, db)
        other_name, other_role = _other_party(user_id, booking, space, db)
        last_msg = _last_message(conversation.id, db)
        sort_key = last_msg.created_at if last_msg else conversation.created_at
        result.append({
            "conversation_id": conversation.id,
            "booking_id": booking.booking_id,
            "space_name": space.name,
            "space_location": space.location,
            "start_date": booking.start_date,
            "end_date": booking.end_date,
            "other_party_name": other_name,
            "other_party_role": other_role,
            "last_message_body": last_msg.body if last_msg else None,
            "last_message_at": last_msg.created_at if last_msg else None,
            "_sort_key": sort_key,
        })
    result.sort(key=lambda item: item["_sort_key"], reverse=True)
    for item in result:
        del item["_sort_key"]
    return result


def get_conversation_access(
    conversation_id: str,
    user_id: str,
    db: Session,
) -> Tuple[Optional[Conversation], Optional[Booking], Optional[Space], Optional[str]]:
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        return None, None, None, "not_found"

    booking = db.query(Booking).filter(Booking.booking_id == conversation.booking_id).first()
    if not booking:
        return None, None, None, "not_found"

    space = db.query(Space).filter(Space.id == booking.space_id).first()
    if not space or not user_can_access_booking(user_id, booking, space):
        return None, None, None, "forbidden"

    if not booking_is_chat_eligible(booking):
        return None, None, None, "forbidden"

    return conversation, booking, space, None


def get_messages_for_conversation(
    conversation_id: str,
    user_id: str,
    db: Session,
) -> Tuple[Optional[List[Message]], Optional[str]]:
    conversation, _, _, error = get_conversation_access(conversation_id, user_id, db)
    if error:
        return None, error

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return messages, None


def get_booking_chat_access(
    booking_id: str,
    user_id: str,
    db: Session,
) -> Tuple[Optional[Conversation], Optional[str]]:
    booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
    if not booking or not booking_is_chat_eligible(booking):
        return None, "forbidden"

    space = db.query(Space).filter(Space.id == booking.space_id).first()
    if not space or not user_can_access_booking(user_id, booking, space):
        return None, "forbidden"

    return get_or_create_conversation(booking_id, db), None


def create_message(
    conversation_id: str,
    sender_user_id: str,
    body: str,
    db: Session,
) -> Tuple[Optional[Message], Optional[str]]:
    conversation, _, _, error = get_conversation_access(conversation_id, sender_user_id, db)
    if error:
        return None, error

    message = Message(
        id=uuid.uuid4().hex,
        conversation_id=conversation.id,
        sender_user_id=sender_user_id,
        body=body.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message, None
