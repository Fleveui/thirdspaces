"""API tests for bookings routes."""

from datetime import datetime, timedelta

from models import Booking, PersonalAccount, Space
from tests.conftest import auth_headers, register_user


def valid_space_payload(**overrides):
    payload = {
        "name": "New Loft",
        "location": "Via Test, Milano",
        "area_m2": 85.0,
        "category": "Loft",
        "is_outdoor": False,
        "availability": "Flexible",
        "description": "Great space",
        "rules": "Be respectful",
        "deposit_needed": 300.0,
    }
    payload.update(overrides)
    return payload


def seed_owner_booking(
    db,
    owner_id,
    booking_id="booking-1",
    status="pending",
    exchange_offer="Help with space promotion on social media.",
):
    space = Space(
        id="space-1",
        name="Owner Loft",
        owner_id=owner_id,
        area_m2=90.0,
        category="Loft",
        location="Milan",
    )
    borrower = PersonalAccount(
        id="borrower-1",
        name="Alice",
        surname="Green",
        email="alice@example.com",
    )
    booking = Booking(
        booking_id=booking_id,
        space_id="space-1",
        borrower_id="borrower-1",
        start_date=datetime.utcnow() + timedelta(days=5),
        end_date=datetime.utcnow() + timedelta(days=10),
        status=status,
        exchange_offer=exchange_offer,
        created_at=datetime.utcnow(),
    )
    db.add(space)
    db.add(borrower)
    db.add(booking)
    db.commit()


class TestListMyBookings:
    def test_requires_space_owner(self, client, regular_user_token):
        response = client.get(
            "/api/bookings/mine",
            headers=auth_headers(regular_user_token),
        )

        assert response.status_code == 403

    def test_returns_owner_bookings(self, client, space_owner_token, db):
        register_response = client.get(
            "/api/auth/me",
            headers=auth_headers(space_owner_token),
        )
        owner_id = register_response.json()["id"]
        seed_owner_booking(db, owner_id)

        response = client.get(
            "/api/bookings/mine",
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 200
        bookings = response.json()
        assert len(bookings) == 1
        assert bookings[0]["booking_id"] == "booking-1"
        assert bookings[0]["space_name"] == "Owner Loft"
        assert bookings[0]["borrower_name"] == "Alice Green"
        assert bookings[0]["exchange_offer"] == "Help with space promotion on social media."


class TestGetBooking:
    def test_get_booking_detail(self, client, space_owner_token, db):
        owner_id = client.get(
            "/api/auth/me",
            headers=auth_headers(space_owner_token),
        ).json()["id"]
        seed_owner_booking(db, owner_id)

        response = client.get(
            "/api/bookings/booking-1",
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "pending"
        assert data["space_location"] == "Milan"
        assert data["exchange_offer"] == "Help with space promotion on social media."

    def test_get_booking_not_found(self, client, space_owner_token):
        response = client.get(
            "/api/bookings/missing-id",
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 404


class TestApproveRejectBooking:
    def test_approve_pending_booking(self, client, space_owner_token, db):
        owner_id = client.get(
            "/api/auth/me",
            headers=auth_headers(space_owner_token),
        ).json()["id"]
        seed_owner_booking(db, owner_id)

        response = client.patch(
            "/api/bookings/booking-1/approve",
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    def test_reject_pending_booking(self, client, space_owner_token, db):
        owner_id = client.get(
            "/api/auth/me",
            headers=auth_headers(space_owner_token),
        ).json()["id"]
        seed_owner_booking(db, owner_id)

        response = client.patch(
            "/api/bookings/booking-1/reject",
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

    def test_cannot_approve_already_approved(self, client, space_owner_token, db):
        owner_id = client.get(
            "/api/auth/me",
            headers=auth_headers(space_owner_token),
        ).json()["id"]
        seed_owner_booking(db, owner_id, status="approved")

        response = client.patch(
            "/api/bookings/booking-1/reject",
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 400
        assert response.json()["detail"] == "Only pending bookings can be updated"

    def test_regular_user_cannot_approve(self, client, regular_user_token, db):
        register_user(
            client,
            username="owner2",
            email="owner2@example.com",
            password="secret12",
            account_type="space_owner",
        )
        owner_login = client.post(
            "/api/auth/login",
            json={"username": "owner2", "password": "secret12"},
        )
        owner_id = owner_login.json()["user"]["id"]
        seed_owner_booking(db, owner_id)

        response = client.patch(
            "/api/bookings/booking-1/approve",
            headers=auth_headers(regular_user_token),
        )

        assert response.status_code == 403


class TestBookingsWithCreatedSpace:
    def test_booking_visible_for_api_created_space(self, client, space_owner_token, db):
        create_response = client.post(
            "/api/spaces",
            json=valid_space_payload(),
            headers=auth_headers(space_owner_token),
        )
        assert create_response.status_code == 201
        space_id = create_response.json()["id"]

        borrower = PersonalAccount(
            id="borrower-2",
            name="Bob",
            surname="Blue",
            email="bob@example.com",
        )
        booking = Booking(
            booking_id="booking-2",
            space_id=space_id,
            borrower_id="borrower-2",
            start_date=datetime.utcnow() + timedelta(days=3),
            end_date=datetime.utcnow() + timedelta(days=6),
            status="pending",
            exchange_offer="Weekend cleanup and event setup support.",
            created_at=datetime.utcnow(),
        )
        db.add(borrower)
        db.add(booking)
        db.commit()

        response = client.get(
            "/api/bookings/mine",
            headers=auth_headers(space_owner_token),
        )

        assert response.status_code == 200
        bookings = response.json()
        assert len(bookings) == 1
        assert bookings[0]["booking_id"] == "booking-2"
        assert bookings[0]["borrower_name"] == "Bob Blue"
        assert bookings[0]["space_name"] == "New Loft"
        assert bookings[0]["exchange_offer"] == "Weekend cleanup and event setup support."
