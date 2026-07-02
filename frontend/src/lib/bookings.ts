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
  created_at: string
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
