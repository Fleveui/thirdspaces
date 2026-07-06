'use client'

import Link from 'next/link'
import { OwnerBooking, formatDateRange, exchangeOfferPreview, needsRating } from '@/lib/bookings'
import { accentClasses } from '@/lib/theme'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

interface IncomingRequestCardProps {
  booking: OwnerBooking
  showActions?: boolean
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  actionBookingId?: string | null
}

function cardBorderClass(status: string): string {
  if (status === 'approved') return 'border-2 border-green-200'
  if (status === 'rejected') return 'border-2 border-red-200'
  return 'border border-host-cream/40'
}

export function IncomingRequestCard({
  booking,
  showActions,
  onApprove,
  onReject,
  actionBookingId,
}: IncomingRequestCardProps) {
  const host = accentClasses('host')
  const preview = exchangeOfferPreview(booking.exchange_offer, 100)
  const isPending = booking.status === 'pending'

  return (
    <div className={`bg-white rounded-3xl shadow-sm p-4 ${cardBorderClass(booking.status)}`}>
      <Link href={`/bookings/${booking.booking_id}`} className="block">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-host-cream-light text-host-cream-accent font-semibold flex items-center justify-center shrink-0">
            {initials(booking.borrower_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-bold text-dark">{booking.borrower_name}</p>
                <p className="text-sm text-gray-500">{booking.space_name}</p>
              </div>
              {isPending && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${host.categoryBadge}`}>
                  Pending
                </span>
              )}
              {!isPending && booking.status === 'approved' && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 shrink-0">
                  Confirmed
                </span>
              )}
              {!isPending && booking.status === 'rejected' && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-600 shrink-0">
                  Rejected
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {formatDateRange(booking.start_date, booking.end_date)}
            </p>
            {preview && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{preview}</p>
            )}
            {needsRating(booking) && (
              <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                Rate your visit
              </span>
            )}
          </div>
        </div>
      </Link>
      {showActions && isPending && onApprove && onReject && (
        <div className="flex gap-2 mt-4 pl-15">
          <button
            type="button"
            onClick={() => onApprove(booking.booking_id)}
            disabled={actionBookingId === booking.booking_id}
            className="btn-host text-sm px-4 py-2 flex-1 rounded-2xl disabled:opacity-50"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onReject(booking.booking_id)}
            disabled={actionBookingId === booking.booking_id}
            className="btn-host-outline text-sm px-4 py-2 flex-1 rounded-2xl disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  )
}
