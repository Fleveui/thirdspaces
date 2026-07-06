'use client'

import Link from 'next/link'
import {
  BorrowerBooking,
  formatDateRange,
  exchangeOfferPreview,
  statusLabel,
  needsRating,
} from '@/lib/bookings'

function spaceInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function statusBadgeClass(status: string): string {
  if (status === 'pending') return 'bg-orange-50 text-orange-600'
  if (status === 'approved') return 'bg-green-50 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

interface MyBookingRequestCardProps {
  booking: BorrowerBooking
}

export function MyBookingRequestCard({ booking }: MyBookingRequestCardProps) {
  const preview = exchangeOfferPreview(booking.exchange_offer, 100)

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4">
      <Link href={`/bookings/${booking.booking_id}`} className="block">
        <div className="flex gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-light text-primary font-semibold flex items-center justify-center shrink-0">
            {spaceInitials(booking.space_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start gap-2">
              <div>
                <p className="font-bold text-dark">{booking.space_name}</p>
                <p className="text-sm text-gray-500">
                  {booking.space_location || 'Bolzano'}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusBadgeClass(booking.status)}`}
              >
                {statusLabel(booking.status)}
              </span>
            </div>
            {needsRating(booking) && (
              <span className="inline-block mt-2 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                Rate your visit
              </span>
            )}
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
          </div>
        </div>
      </Link>
    </div>
  )
}
