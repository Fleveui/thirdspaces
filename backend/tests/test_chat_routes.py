"""API tests for chat routes."""

import pytest
from datetime import datetime, timedelta

from models import Booking, PersonalAccount, Space, User
from tests.conftest import auth_headers, login_user, register_user


def get_user_id(client, token):
    return client.get("/api/auth/me", headers=auth_headers(token)).json()["id"]


def seed_eligible_chat_booking(
    db,
    owner_id,
    borrower_user_id,
    booking_id="booking-chat-1",
    *,
    approved=True,
    borrower_signed=False,
    owner_signed=False,
):
    space = Space(
        id="space-chat-1",
        name="Chat Loft",
        owner_id=owner_id,
        area_m2=90.0,
        category="Loft",
        location="Bolzano",
    )
    borrower_user = db.query(User).filter(User.id == borrower_user_id).first()
    borrower = db.query(PersonalAccount).filter(PersonalAccount.id == borrower_user_id).first()
    if borrower:
        borrower.name = "Alice"
        borrower.surname = "Green"
    else:
        borrower = PersonalAccount(
            id=borrower_user_id,
            name="Alice",
            surname="Green",
            email=borrower_user.email if borrower_user else "borrower@example.com",
        )
        db.add(borrower)
    now = datetime.utcnow()
    booking = Booking(
        booking_id=booking_id,
        space_id="space-chat-1",
        borrower_id=borrower_user_id,
        start_date=now + timedelta(days=5),
        end_date=now + timedelta(days=10),
        status="approved" if approved else "pending",
        exchange_offer="Promotion help",
        contract_text="Agreement text",
        borrower_signed_at=now if borrower_signed else None,
        owner_signed_at=now if owner_signed else None,
        created_at=now,
    )
    db.add(space)
    db.add(booking)
    db.commit()
    return booking


class TestListConversations:
    def test_empty_when_no_eligible_bookings(self, client, regular_user_token):
        response = client.get(
            "/api/chat/conversations",
            headers=auth_headers(regular_user_token),
        )

        assert response.status_code == 200
        assert response.json() == []

    def test_lists_conversation_when_approved_unsigned(self, client, space_owner_token, regular_user_token, db):
        owner_id = get_user_id(client, space_owner_token)
        borrower_id = get_user_id(client, regular_user_token)
        seed_eligible_chat_booking(db, owner_id, borrower_id, approved=True)

        owner_response = client.get(
            "/api/chat/conversations",
            headers=auth_headers(space_owner_token),
        )
        borrower_response = client.get(
            "/api/chat/conversations",
            headers=auth_headers(regular_user_token),
        )

        assert len(owner_response.json()) == 1
        assert len(borrower_response.json()) == 1
        assert borrower_response.json()[0]["booking_id"] == "booking-chat-1"

    def test_lists_conversation_after_both_signed(self, client, space_owner_token, regular_user_token, db):
        owner_id = get_user_id(client, space_owner_token)
        borrower_id = get_user_id(client, regular_user_token)
        seed_eligible_chat_booking(
            db,
            owner_id,
            borrower_id,
            borrower_signed=True,
            owner_signed=True,
        )

        response = client.get(
            "/api/chat/conversations",
            headers=auth_headers(regular_user_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["booking_id"] == "booking-chat-1"
        assert data[0]["space_name"] == "Chat Loft"
        assert data[0]["other_party_name"] == "owner1"
        assert data[0]["other_party_role"] == "owner"
        assert data[0]["conversation_id"]
        assert data[0]["space_location"] == "Bolzano"
        assert data[0]["start_date"] is not None
        assert data[0]["end_date"] is not None


class TestGetMessages:
    def test_forbidden_for_non_participant(self, client, space_owner_token, regular_user_token, db):
        owner_id = get_user_id(client, space_owner_token)
        borrower_id = get_user_id(client, regular_user_token)
        seed_eligible_chat_booking(
            db,
            owner_id,
            borrower_id,
            borrower_signed=True,
            owner_signed=True,
        )

        register_user(
            client,
            username="outsider",
            email="outsider@example.com",
            password="secret12",
        )
        outsider_token = login_user(client, "outsider", "secret12").json()["token"]

        conversation_id = client.get(
            "/api/chat/conversations",
            headers=auth_headers(regular_user_token),
        ).json()[0]["conversation_id"]

        response = client.get(
            f"/api/chat/{conversation_id}/messages",
            headers=auth_headers(outsider_token),
        )

        assert response.status_code == 403

    def test_not_found_for_unknown_conversation(self, client, regular_user_token):
        response = client.get(
            "/api/chat/missing-conversation/messages",
            headers=auth_headers(regular_user_token),
        )

        assert response.status_code == 404


class TestChatWebSocket:
    def test_rejects_pending_booking(self, client, space_owner_token, regular_user_token, db):
        owner_id = get_user_id(client, space_owner_token)
        borrower_id = get_user_id(client, regular_user_token)
        seed_eligible_chat_booking(db, owner_id, borrower_id, approved=False)

        from starlette.websockets import WebSocketDisconnect

        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(
                f"/api/chat/ws/booking-chat-1?token={regular_user_token}"
            ):
                pass

        assert exc_info.value.code == 4003

    def test_send_and_receive_message(self, client, space_owner_token, regular_user_token, db):
        owner_id = get_user_id(client, space_owner_token)
        borrower_id = get_user_id(client, regular_user_token)
        seed_eligible_chat_booking(db, owner_id, borrower_id, approved=True)

        with client.websocket_connect(
            f"/api/chat/ws/booking-chat-1?token={regular_user_token}"
        ) as borrower_ws:
            with client.websocket_connect(
                f"/api/chat/ws/booking-chat-1?token={space_owner_token}"
            ) as owner_ws:
                borrower_ws.send_text("Hello owner")
                payload = owner_ws.receive_json()
                assert payload["body"] == "Hello owner"
                assert payload["sender_user_id"] == borrower_id

                owner_ws.send_text("Hello borrower")
                while True:
                    payload = borrower_ws.receive_json()
                    if payload["body"] == "Hello borrower":
                        break
                assert payload["sender_user_id"] == owner_id

        conversation_id = client.get(
            "/api/chat/conversations",
            headers=auth_headers(regular_user_token),
        ).json()[0]["conversation_id"]

        history = client.get(
            f"/api/chat/{conversation_id}/messages",
            headers=auth_headers(regular_user_token),
        ).json()

        assert len(history) == 2
        assert history[0]["body"] == "Hello owner"
        assert history[1]["body"] == "Hello borrower"
