/**
 * Booking Detail Page — owner approve/reject, contract signing, ratings.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import {
  OwnerBooking,
  formatDate,
  formatDateRange,
  statusLabel,
  borrowerStatusMessage,
  contractFullySigned,
  canRateBooking,
} from '@/lib/bookings'

function BookingDetailContent() {
  const params = useParams()
  const { user } = useAuth()
  const bookingId = params.id as string
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const [booking, setBooking] = useState<OwnerBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [rating, setRating] = useState(5)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingMessage, setRatingMessage] = useState<string | null>(null)

  const fetchBooking = async () => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${apiUrl}/api/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status === 404) {
      setNotFound(true)
      return
    }
    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.detail || 'Failed to load booking')
    }
    setBooking(await response.json())
  }

  useEffect(() => {
    const load = async () => {
      try {
        await fetchBooking()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [bookingId, apiUrl])

  const isOwner = booking?.role === 'owner' || (user && booking?.owner_id === user.id)

  const handleAction = async (action: 'approve' | 'reject' | 'sign') => {
    setSubmitting(true)
    setActionError(null)
    try {
      const token = localStorage.getItem('auth_token')
      const method = action === 'sign' ? 'PATCH' : 'PATCH'
      const path = action === 'sign' ? 'sign' : action
      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}/${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || `Failed to ${action}`)
      }
      setBooking(await response.json())
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRate = async () => {
    setSubmitting(true)
    setActionError(null)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment: ratingComment || null }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to submit rating')
      }
      setRatingMessage('Thank you for your rating!')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const userSigned =
    isOwner ? Boolean(booking?.owner_signed_at) : Boolean(booking?.borrower_signed_at)
  const otherSigned =
    isOwner ? Boolean(booking?.borrower_signed_at) : Boolean(booking?.owner_signed_at)

  const backHref = isOwner ? '/host' : '/find'
  const backLabel = isOwner ? 'Back to My spaces' : 'Back to Find a space'

  return (
    <AppShell mode={isOwner ? 'host' : 'find'}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={backHref} className="font-medium text-primary hover:underline">
            {backLabel}
          </Link>
        </div>

        {loading ? (
          <div className="card"><p className="text-gray-600 text-sm">Loading booking details...</p></div>
        ) : notFound ? (
          <div className="card"><h1 className="text-2xl font-bold text-dark mb-2">Booking not found</h1></div>
        ) : error ? (
          <div className="card"><p className="text-red-600 text-sm">{error}</p></div>
        ) : booking ? (
          <div className="card">
            <h1 className="text-2xl font-bold text-primary mb-2">Booking</h1>
            <p className="text-sm text-gray-600 mb-2">{statusLabel(booking.status)}</p>
            {!isOwner && borrowerStatusMessage(booking.status) && (
              <p className="text-sm text-primary italic mb-4">{borrowerStatusMessage(booking.status)}</p>
            )}

            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-medium text-gray-600 mb-1">Space</h2>
                <Link href={`/spaces/${booking.space_id}`} className="font-medium text-primary hover:underline">
                  {booking.space_name}
                </Link>
              </div>
              {isOwner && booking.borrower_name && (
                <div>
                  <h2 className="text-sm font-medium text-gray-600 mb-1">Borrower</h2>
                  <p className="text-dark">{booking.borrower_name}</p>
                </div>
              )}
              <div>
                <h2 className="text-sm font-medium text-gray-600 mb-1">Dates</h2>
                <p className="text-dark">{formatDateRange(booking.start_date, booking.end_date)}</p>
              </div>
              {booking.intended_use && (
                <div>
                  <h2 className="text-sm font-medium text-gray-600 mb-1">Intended use</h2>
                  <p className="text-dark">{booking.intended_use}</p>
                </div>
              )}
              <div>
                <h2 className="text-sm font-medium text-gray-600 mb-1">Offered in exchange</h2>
                <p className="text-dark whitespace-pre-wrap">
                  {booking.exchange_offer?.trim() || 'No exchange offer provided'}
                </p>
              </div>
              <div>
                <h2 className="text-sm font-medium text-gray-600 mb-1">Requested on</h2>
                <p className="text-dark">{formatDate(booking.created_at)}</p>
              </div>
            </div>

            {booking.status === 'approved' && booking.contract_text && (
              <div className="mt-8 p-4 bg-primary-light/50 rounded-2xl">
                <h2 className="font-semibold text-dark mb-2">Agreement</h2>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans mb-4">
                  {booking.contract_text}
                </pre>
                <p className="text-xs text-gray-500 mb-3">
                  Borrower: {booking.borrower_signed_at ? 'Signed' : 'Pending'} · Owner:{' '}
                  {booking.owner_signed_at ? 'Signed' : 'Pending'}
                </p>
                {!userSigned && (
                  <button
                    type="button"
                    onClick={() => handleAction('sign')}
                    disabled={submitting}
                    className="btn-primary disabled:opacity-50"
                  >
                    I agree
                  </button>
                )}
                {userSigned && !otherSigned && (
                  <p className="text-sm text-gray-600">Waiting for the other party to sign.</p>
                )}
                {contractFullySigned(booking.borrower_signed_at, booking.owner_signed_at) && (
                  <Link
                    href={`/messages?booking=${booking.booking_id}`}
                    className="btn-outline text-sm inline-block mt-2"
                  >
                    Open chat
                  </Link>
                )}
              </div>
            )}

            {canRateBooking(
              booking.status,
              booking.end_date,
              booking.borrower_signed_at,
              booking.owner_signed_at
            ) && !ratingMessage && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <h2 className="font-semibold text-dark mb-3">Rate after visit</h2>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="input mb-3"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} stars</option>
                  ))}
                </select>
                <textarea
                  placeholder="Optional comment"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="input resize-y mb-3"
                  rows={2}
                />
                <button
                  type="button"
                  onClick={handleRate}
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50"
                >
                  Submit rating
                </button>
              </div>
            )}
            {ratingMessage && <p className="text-primary text-sm mt-6">{ratingMessage}</p>}

            {actionError && <p className="text-red-600 text-sm mt-6">{actionError}</p>}

            {isOwner && booking.status === 'pending' && (
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => handleAction('approve')}
                  disabled={submitting}
                  className="btn-primary disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('reject')}
                  disabled={submitting}
                  className="btn-secondary disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

export default function BookingDetailPage() {
  return (
    <ProtectedRoute>
      <BookingDetailContent />
    </ProtectedRoute>
  )
}
