# Bookings API Routes
# HTTP endpoints for space owners to view and manage booking requests

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_space_owner
from models import User
from services.bookings import (
    get_booking_for_owner,
    list_bookings_for_owner,
    update_booking_status,
)

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


class OwnerBookingResponse(BaseModel):
    booking_id: str
    space_id: str
    space_name: str
    space_location: Optional[str] = None
    borrower_name: str
    borrower_email: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str
    exchange_offer: Optional[str] = None
    created_at: datetime


@router.get("/mine", response_model=List[OwnerBookingResponse])
def list_my_bookings(
    user: User = Depends(require_space_owner),
    db: Session = Depends(get_db),
):
    """
    List all bookings for spaces owned by the authenticated space owner.
    """
    return list_bookings_for_owner(owner_id=user.id, db=db)


@router.get("/{booking_id}", response_model=OwnerBookingResponse)
def get_booking(
    booking_id: str,
    user: User = Depends(require_space_owner),
    db: Session = Depends(get_db),
):
    """
    Get details of a single booking for an owned space.
    """
    booking = get_booking_for_owner(booking_id=booking_id, owner_id=user.id, db=db)

    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {booking_id} not found",
        )

    return booking


@router.patch("/{booking_id}/approve", response_model=OwnerBookingResponse)
def approve_booking(
    booking_id: str,
    user: User = Depends(require_space_owner),
    db: Session = Depends(get_db),
):
    """
    Approve a pending booking request.
    """
    booking, error = update_booking_status(
        booking_id=booking_id,
        owner_id=user.id,
        new_status="approved",
        db=db,
    )

    if error:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if error == "Booking not found"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=error)

    return booking


@router.patch("/{booking_id}/reject", response_model=OwnerBookingResponse)
def reject_booking(
    booking_id: str,
    user: User = Depends(require_space_owner),
    db: Session = Depends(get_db),
):
    """
    Reject a pending booking request.
    """
    booking, error = update_booking_status(
        booking_id=booking_id,
        owner_id=user.id,
        new_status="rejected",
        db=db,
    )

    if error:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if error == "Booking not found"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=error)

    return booking
