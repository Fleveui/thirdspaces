export interface OwnerBooking {
  booking_id: string
  space_id: string
  space_name: string
  space_location: string | null
  borrower_name: string
  borrower_email: string | null
  start_date: string | null
  end_date: string | null
  status: string
  exchange_offer: string | null
  intended_use?: string | null
  contract_text?: string | null
  borrower_signed_at?: string | null
  owner_signed_at?: string | null
  created_at: string
  role?: string
  owner_id?: string
  rating_eligible?: boolean
  user_has_rated?: boolean
  user_rating?: number | null
}

export type BorrowerBooking = OwnerBooking

export function countBookingsBySpace(bookings: OwnerBooking[]): Record<string, number> {
  return bookings.reduce<Record<string, number>>((acc, booking) => {
    acc[booking.space_id] = (acc[booking.space_id] ?? 0) + 1
    return acc
  }, {})
}

export function countPendingBookingsBySpace(bookings: OwnerBooking[]): Record<string, number> {
  return bookings.reduce<Record<string, number>>((acc, booking) => {
    if (booking.status !== 'pending') return acc
    acc[booking.space_id] = (acc[booking.space_id] ?? 0) + 1
    return acc
  }, {})
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'Pending Approval'
    case 'approved':
      return 'Confirmed'
    case 'rejected':
      return 'Rejected'
    default:
      return status
  }
}

export function borrowerStatusMessage(status: string): string | null {
  switch (status) {
    case 'approved':
      return "Fantastic! You've got the keys!"
    case 'rejected':
      return 'Sorry, maybe next time.'
    default:
      return null
  }
}

export function formatDate(value: string | null): string {
  if (!value) return 'Not set'
  return new Date(value).toLocaleDateString()
}

export function formatDateRange(start: string | null, end: string | null): string {
  return `${formatDate(start)} – ${formatDate(end)}`
}

export function exchangeOfferPreview(value: string | null, maxLength = 80): string | null {
  if (!value?.trim()) return null
  const trimmed = value.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength).trimEnd()}...`
}

export function contractFullySigned(
  borrowerSigned: string | null | undefined,
  ownerSigned: string | null | undefined
): boolean {
  return Boolean(borrowerSigned && ownerSigned)
}

export function bookingChatEligible(booking: { status: string }): boolean {
  return booking.status === 'approved'
}

export function isVisitPast(endDate: string | null): boolean {
  if (!endDate) return false
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  return end <= new Date()
}

export function canRateBooking(booking: {
  status: string
  end_date?: string | null
  rating_eligible?: boolean
}): boolean {
  if (booking.rating_eligible !== undefined) return booking.rating_eligible
  if (booking.status !== 'approved') return false
  if (!booking.end_date) return true
  return isVisitPast(booking.end_date)
}

export function needsRating(booking: OwnerBooking): boolean {
  return Boolean(canRateBooking(booking) && !booking.user_has_rated)
}
