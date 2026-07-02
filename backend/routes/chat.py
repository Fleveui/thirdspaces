# Chat API Routes — WebSocket and conversation history

import uuid
from datetime import datetime
from typing import Dict, List, Set

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from dependencies import get_current_user
from models import Booking, Conversation, Message, Space, User
from services.auth import verify_token

router = APIRouter(prefix="/api/chat", tags=["chat"])

active_connections: Dict[str, Set[WebSocket]] = {}


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_user_id: str
    body: str
    created_at: datetime


def _get_or_create_conversation(booking_id: str, db: Session) -> Conversation:
    conversation = db.query(Conversation).filter(Conversation.booking_id == booking_id).first()
    if conversation:
        return conversation
    conversation = Conversation(id=uuid.uuid4().hex, booking_id=booking_id)
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def _user_can_access_booking(user_id: str, booking: Booking, space: Space) -> bool:
    return user_id in (booking.borrower_id, space.owner_id)


def _booking_is_chat_eligible(booking: Booking) -> bool:
    return booking.status == "approved"


@router.get("/conversations", response_model=List[dict])
def list_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(Booking, Space, Conversation)
        .join(Space, Booking.space_id == Space.id)
        .outerjoin(Conversation, Conversation.booking_id == Booking.booking_id)
        .filter(Booking.status == "approved")
        .all()
    )
    result = []
    for booking, space, conversation in rows:
        if not _user_can_access_booking(user.id, booking, space):
            continue
        if not conversation:
            conversation = _get_or_create_conversation(booking.booking_id, db)
        result.append({
            "conversation_id": conversation.id,
            "booking_id": booking.booking_id,
            "space_name": space.name,
        })
    return result


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    booking = db.query(Booking).filter(Booking.booking_id == conversation.booking_id).first()
    space = db.query(Space).filter(Space.id == booking.space_id).first()
    if not booking or not space or not _user_can_access_booking(user.id, booking, space):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )
    return messages


@router.websocket("/ws/{booking_id}")
async def chat_websocket(websocket: WebSocket, booking_id: str):
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001)
        return

    user_id = verify_token(token)
    if not user_id:
        await websocket.close(code=4001)
        return

    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.booking_id == booking_id).first()
        if not booking or not _booking_is_chat_eligible(booking):
            await websocket.close(code=4003)
            return

        space = db.query(Space).filter(Space.id == booking.space_id).first()
        if not space or not _user_can_access_booking(user_id, booking, space):
            await websocket.close(code=4003)
            return

        conversation = _get_or_create_conversation(booking_id, db)
        await websocket.accept()

        if booking_id not in active_connections:
            active_connections[booking_id] = set()
        active_connections[booking_id].add(websocket)

        try:
            while True:
                data = await websocket.receive_text()
                if not data.strip():
                    continue

                message = Message(
                    id=uuid.uuid4().hex,
                    conversation_id=conversation.id,
                    sender_user_id=user_id,
                    body=data.strip(),
                )
                db.add(message)
                db.commit()
                db.refresh(message)

                payload = {
                    "id": message.id,
                    "sender_user_id": message.sender_user_id,
                    "body": message.body,
                    "created_at": message.created_at.isoformat(),
                }

                dead = set()
                for conn in active_connections.get(booking_id, set()):
                    try:
                        await conn.send_json(payload)
                    except Exception:
                        dead.add(conn)
                active_connections[booking_id] -= dead
        except WebSocketDisconnect:
            active_connections.get(booking_id, set()).discard(websocket)
    finally:
        db.close()
