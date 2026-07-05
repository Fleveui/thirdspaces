# Chat API Routes — WebSocket and conversation history

from datetime import datetime
from typing import Dict, List, Optional, Set

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import SessionLocal, get_db
from dependencies import get_current_user
from models import User
from services.auth import verify_token
from services.chat import (
    create_message,
    get_booking_chat_access,
    get_messages_for_conversation,
    list_conversations_for_user,
)

router = APIRouter(prefix="/api/chat", tags=["chat"])

active_connections: Dict[str, Set[WebSocket]] = {}


def create_ws_db() -> Session:
    return SessionLocal()


class ConversationResponse(BaseModel):
    conversation_id: str
    booking_id: str
    space_name: str
    space_location: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    other_party_name: str
    other_party_role: str
    last_message_body: Optional[str] = None
    last_message_at: Optional[datetime] = None


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_user_id: str
    body: str
    created_at: datetime


@router.get("/conversations", response_model=List[ConversationResponse])
def list_conversations(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_conversations_for_user(user.id, db)


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    messages, error = get_messages_for_conversation(conversation_id, user.id, db)
    if error == "not_found":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    if error == "forbidden":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
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

    db = create_ws_db()
    try:
        conversation, error = get_booking_chat_access(booking_id, user_id, db)
        if error:
            await websocket.close(code=4003)
            return

        await websocket.accept()

        if booking_id not in active_connections:
            active_connections[booking_id] = set()
        active_connections[booking_id].add(websocket)

        try:
            while True:
                data = await websocket.receive_text()
                if not data.strip():
                    continue

                message, msg_error = create_message(
                    conversation.id,
                    user_id,
                    data,
                    db,
                )
                if msg_error or not message:
                    continue

                payload = {
                    "id": message.id,
                    "conversation_id": message.conversation_id,
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
