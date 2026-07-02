"""Unit tests for bookings service functions."""

from datetime import datetime, timedelta

from models import Booking, PersonalAccount, Space
from services.bookings import (
    get_booking_for_owner,
    list_bookings_for_owner,
    update_booking_status,
)


def create_space(db, owner_id, name="Test Space", space_id="space-1"):
    space = Space(
        id=space_id,
        name=name,
        owner_id=owner_id,
        area_m2=100.0,
        category="Loft",
        location="Milan",
    )
    db.add(space)
    db.commit()
    return space


def create_borrower(db, borrower_id="borrower-1"):
    borrower = PersonalAccount(
        id=borrower_id,
        name="Alice",
        surname="Green",
        email="alice@example.com",
    )
    db.add(borrower)
    db.commit()
    return borrower


def create_booking(
    db,
    booking_id="booking-1",
    space_id="space-1",
    borrower_id="borrower-1",
    status="pending",
    exchange_offer=None,
):
    booking = Booking(
        booking_id=booking_id,
        space_id=space_id,
        borrower_id=borrower_id,
        start_date=datetime.utcnow() + timedelta(days=7),
        end_date=datetime.utcnow() + timedelta(days=14),
        status=status,
        exchange_offer=exchange_offer,
        created_at=datetime.utcnow(),
    )
    db.add(booking)
    db.commit()
    return booking


class TestListBookingsForOwner:
    def test_returns_bookings_for_owned_spaces_only(self, db):
        create_space(db, owner_id="owner-1", space_id="space-1")
        create_space(db, owner_id="owner-2", space_id="space-2", name="Other Space")
        create_borrower(db)
        create_booking(db, booking_id="booking-1", space_id="space-1")
        create_booking(db, booking_id="booking-2", space_id="space-2")

        results = list_bookings_for_owner("owner-1", db)

        assert len(results) == 1
        assert results[0]["booking_id"] == "booking-1"
        assert results[0]["space_name"] == "Test Space"
        assert results[0]["borrower_name"] == "Alice Green"
        assert results[0]["borrower_email"] == "alice@example.com"

    def test_returns_exchange_offer(self, db):
        create_space(db, owner_id="owner-1")
        create_borrower(db)
        create_booking(
            db,
            exchange_offer="Free yoga classes for the community.",
        )

        results = list_bookings_for_owner("owner-1", db)

        assert results[0]["exchange_offer"] == "Free yoga classes for the community."

    def test_unknown_borrower_fallback(self, db):
        create_space(db, owner_id="owner-1")
        create_booking(db, borrower_id="missing-borrower")

        results = list_bookings_for_owner("owner-1", db)

        assert results[0]["borrower_name"] == "Unknown borrower"
        assert results[0]["borrower_email"] is None


class TestGetBookingForOwner:
    def test_returns_booking_for_owner(self, db):
        create_space(db, owner_id="owner-1")
        create_borrower(db)
        create_booking(db, booking_id="booking-1")

        result = get_booking_for_owner("booking-1", "owner-1", db)

        assert result is not None
        assert result["booking_id"] == "booking-1"
        assert result["status"] == "pending"

    def test_returns_none_for_other_owner(self, db):
        create_space(db, owner_id="owner-1")
        create_borrower(db)
        create_booking(db, booking_id="booking-1")

        result = get_booking_for_owner("booking-1", "owner-2", db)

        assert result is None


class TestUpdateBookingStatus:
    def test_approve_pending_booking(self, db):
        create_space(db, owner_id="owner-1")
        create_borrower(db)
        create_booking(db, booking_id="booking-1")

        booking, error = update_booking_status(
            "booking-1", "owner-1", "approved", db
        )

        assert error is None
        assert booking["status"] == "approved"

    def test_reject_pending_booking(self, db):
        create_space(db, owner_id="owner-1")
        create_borrower(db)
        create_booking(db, booking_id="booking-1")

        booking, error = update_booking_status(
            "booking-1", "owner-1", "rejected", db
        )

        assert error is None
        assert booking["status"] == "rejected"

    def test_cannot_update_non_pending_booking(self, db):
        create_space(db, owner_id="owner-1")
        create_borrower(db)
        create_booking(db, booking_id="booking-1", status="approved")

        booking, error = update_booking_status(
            "booking-1", "owner-1", "rejected", db
        )

        assert booking is None
        assert error == "Only pending bookings can be updated"

    def test_cannot_update_other_owner_booking(self, db):
        create_space(db, owner_id="owner-1")
        create_borrower(db)
        create_booking(db, booking_id="booking-1")

        booking, error = update_booking_status(
            "booking-1", "owner-2", "approved", db
        )

        assert booking is None
        assert error == "Booking not found"
