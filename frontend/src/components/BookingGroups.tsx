'use client'

import Link from 'next/link'
import {
  OwnerBooking,
  BorrowerBooking,
  formatDateRange,
  exchangeOfferPreview,
  statusLabel,
  borrowerStatusMessage,
} from '@/lib/bookings'

export function OwnerBookingGroup({
  title,
  bookings,
  showActions,
  onApprove,
  onReject,
  actionBookingId,
}: {
  title: string
  bookings: OwnerBooking[]
  showActions?: boolean
  onApprove?: (bookingId: string) => void
  onReject?: (bookingId: string) => void
  actionBookingId?: string | null
}) {
  return (
    <div className="border border-primary/10 rounded-2xl p-3 bg-primary-light/30 h-full">
      <h4 className="text-sm font-semibold text-primary mb-2">{title}</h4>
      {bookings.length === 0 ? (
        <p className="text-gray-500 text-sm">No bookings</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {bookings.map((booking) => {
            const offerPreview = exchangeOfferPreview(booking.exchange_offer)
            return (
              <li key={booking.booking_id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex flex-col gap-3">
                  <Link
                    href={`/bookings/${booking.booking_id}`}
                    className="hover:bg-primary-light -mx-2 px-2 py-1 rounded-2xl transition-colors"
                  >
                    <p className="font-medium text-dark">{booking.space_name}</p>
                    <p className="text-sm text-gray-600">{booking.borrower_name}</p>
                    {offerPreview && (
                      <p className="text-sm text-gray-500 italic">{offerPreview}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      {formatDateRange(booking.start_date, booking.end_date)}
                    </p>
                    <p className="text-xs text-primary mt-1">{statusLabel(booking.status)}</p>
                  </Link>
                  {showActions && onApprove && onReject && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onApprove(booking.booking_id)}
                        disabled={actionBookingId === booking.booking_id}
                        className="btn-primary text-sm px-3 py-1.5 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(booking.booking_id)}
                        disabled={actionBookingId === booking.booking_id}
                        className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function BorrowerBookingRow({ booking }: { booking: BorrowerBooking }) {
  return (
    <Link
      href={`/bookings/${booking.booking_id}`}
      className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 bg-white hover:bg-primary-light/30 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="font-medium text-dark truncate">{booking.space_name}</p>
        <p className="text-sm text-gray-600">
          {formatDateRange(booking.start_date, booking.end_date)}
        </p>
        {borrowerStatusMessage(booking.status) && (
          <p className="text-sm text-gray-500 mt-0.5 italic truncate">
            {borrowerStatusMessage(booking.status)}
          </p>
        )}
      </div>
      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary-light text-primary shrink-0">
        {statusLabel(booking.status)}
      </span>
    </Link>
  )
}

export function BorrowerBookingGroup({
  title,
  bookings,
}: {
  title: string
  bookings: BorrowerBooking[]
}) {
  return (
    <div className="border border-primary/10 rounded-2xl p-3 bg-primary-light/30 h-full">
      <h4 className="text-sm font-semibold text-primary mb-2">{title}</h4>
      {bookings.length === 0 ? (
        <p className="text-gray-500 text-sm">No bookings</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {bookings.map((booking) => (
            <li key={booking.booking_id} className="py-3 first:pt-0 last:pb-0">
              <Link
                href={`/bookings/${booking.booking_id}`}
                className="block hover:bg-primary-light -mx-2 px-2 py-1 rounded-2xl transition-colors"
              >
                <p className="font-medium text-dark">{booking.space_name}</p>
                <p className="text-sm text-gray-600">
                  {formatDateRange(booking.start_date, booking.end_date)}
                </p>
                <p className="text-xs text-primary mt-1">{statusLabel(booking.status)}</p>
                {borrowerStatusMessage(booking.status) && (
                  <p className="text-sm text-gray-600 mt-1 italic">
                    {borrowerStatusMessage(booking.status)}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
