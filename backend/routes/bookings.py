# Bookings API Routes
# HTTP endpoints for booking requests, approvals, contracts, and ratings

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import User
from services.bookings import (
    create_booking,
    get_booking_for_user,
    list_bookings_for_borrower,
    list_bookings_for_owner,
    rate_booking,
    sign_booking_contract,
    update_booking_status,
)

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


class BookingResponse(BaseModel):
    booking_id: str
    space_id: str
    space_name: str
    space_location: Optional[str] = None
    borrower_name: Optional[str] = None
    borrower_email: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str
    exchange_offer: Optional[str] = None
    intended_use: Optional[str] = None
    contract_text: Optional[str] = None
    borrower_signed_at: Optional[datetime] = None
    owner_signed_at: Optional[datetime] = None
    created_at: datetime
    role: Optional[str] = None
    owner_id: Optional[str] = None


class CreateBookingRequest(BaseModel):
    space_id: str
    start_date: datetime
    end_date: datetime
    intended_use: str = Field(..., min_length=1)
    exchange_offer: Optional[str] = None
    accepted_terms: bool = False


class RateBookingRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


@router.get("/mine", response_model=List[BookingResponse])
def list_my_bookings(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_bookings_for_owner(owner_id=user.id, db=db)


@router.get("/my-requests", response_model=List[BookingResponse])
def list_my_requests(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return list_bookings_for_borrower(borrower_id=user.id, db=db)


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def submit_booking(
    request: CreateBookingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking, error = create_booking(
        user=user,
        space_id=request.space_id,
        start_date=request.start_date,
        end_date=request.end_date,
        intended_use=request.intended_use,
        exchange_offer=request.exchange_offer,
        accepted_terms=request.accepted_terms,
        db=db,
    )
    if error:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if error == "Space not found"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=error)
    return booking


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = get_booking_for_user(booking_id=booking_id, user_id=user.id, db=db)
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Booking {booking_id} not found",
        )
    return booking


@router.patch("/{booking_id}/approve", response_model=BookingResponse)
def approve_booking(
    booking_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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


@router.patch("/{booking_id}/reject", response_model=BookingResponse)
def reject_booking(
    booking_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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


@router.patch("/{booking_id}/sign", response_model=BookingResponse)
def sign_booking(
    booking_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking, error = sign_booking_contract(
        booking_id=booking_id,
        user_id=user.id,
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


@router.post("/{booking_id}/rate")
def rate_booking_endpoint(
    booking_id: str,
    request: RateBookingRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result, error = rate_booking(
        booking_id=booking_id,
        rater_user_id=user.id,
        rating_value=request.rating,
        comment=request.comment,
        db=db,
    )
    if error:
        status_code = (
            status.HTTP_404_NOT_FOUND
            if error == "Booking not found"
            else status.HTTP_400_BAD_REQUEST
        )
        raise HTTPException(status_code=status_code, detail=error)
    return result
