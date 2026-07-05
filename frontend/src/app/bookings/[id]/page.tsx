/**
 * Booking Detail Page — owner approve/reject, contract signing, ratings.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import {
  OwnerBooking,
  formatDate,
  formatDateRange,
  statusLabel,
  borrowerStatusMessage,
  contractFullySigned,
  canRateBooking,
  bookingChatEligible,
} from '@/lib/bookings'
import { messagesChatHref } from '@/lib/chat'
import { accentClasses } from '@/lib/theme'

function panelClass() {
  return 'rounded-3xl border border-gray-100 bg-white shadow-sm p-5'
}

function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-dark mb-1">{label}</h2>
      <div className="text-gray-600 text-sm">{children}</div>
    </div>
  )
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function statusBadgeClass(status: string): string {
  if (status === 'pending') return 'bg-orange-50 text-orange-600'
  if (status === 'approved') return 'bg-green-50 text-green-700'
  return 'bg-gray-100 text-gray-600'
}

function BookingDetailContent() {
  const params = useParams()
  const router = useRouter()
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
  const accent = isOwner ? 'host' : 'find'
  const theme = accentClasses(accent)
  const backHref = isOwner ? '/host/requests' : '/find/requests'
  const pageTitle = loading ? 'Booking' : notFound ? 'Not found' : booking?.space_name ?? 'Booking'

  const handleAction = async (action: 'approve' | 'reject' | 'sign') => {
    setSubmitting(true)
    setActionError(null)
    try {
      const token = localStorage.getItem('auth_token')
      const path = action === 'sign' ? 'sign' : action
      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}/${path}`, {
        method: 'PATCH',
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

  return (
    <AppShell mode={isOwner ? 'host' : 'find'} variant="minimal">
      <div className="max-w-xl mx-auto">
        <PageHeader
          title={pageTitle}
          onBack={() => router.push(backHref)}
        />

        {loading ? (
          <p className="text-gray-600 text-sm text-center py-12">Loading booking details...</p>
        ) : notFound ? (
          <div className={panelClass()}>
            <h1 className="text-xl font-bold text-dark">Booking not found</h1>
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm text-center py-12">{error}</p>
        ) : booking ? (
          <div className="space-y-4">
            <div className={`${panelClass()} p-4`}>
              <div className="flex gap-3">
                <div
                  className={`w-12 h-12 rounded-full font-semibold flex items-center justify-center shrink-0 ${
                    isOwner
                      ? 'bg-host-cream-light text-host-cream-accent'
                      : 'bg-primary-light text-primary'
                  }`}
                >
                  {isOwner
                    ? initials(booking.borrower_name)
                    : initials(booking.space_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <p className="font-bold text-dark">
                        {isOwner ? booking.borrower_name : booking.space_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {isOwner
                          ? booking.space_name
                          : booking.space_location || 'Bolzano'}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusBadgeClass(booking.status)}`}
                    >
                      {statusLabel(booking.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" />
                      <path d="M16 2v4M8 2v4M3 10h18" />
                    </svg>
                    {formatDateRange(booking.start_date, booking.end_date)}
                  </p>
                  {!isOwner && borrowerStatusMessage(booking.status) && (
                    <p className="text-sm text-primary italic mt-2">
                      {borrowerStatusMessage(booking.status)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className={panelClass()}>
              <div className="space-y-5">
                {!isOwner && (
                  <DetailField label="Space">
                    <Link href={`/spaces/${booking.space_id}`} className={`font-medium ${theme.link}`}>
                      {booking.space_name}
                    </Link>
                  </DetailField>
                )}
                {isOwner && booking.borrower_name && (
                  <DetailField label="Borrower">
                    <p>{booking.borrower_name}</p>
                    {booking.borrower_email && (
                      <p className="text-gray-500 mt-0.5">{booking.borrower_email}</p>
                    )}
                  </DetailField>
                )}
                {booking.intended_use && (
                  <DetailField label="Intended use">
                    <p className="whitespace-pre-wrap">{booking.intended_use}</p>
                  </DetailField>
                )}
                <DetailField label="Offered in exchange">
                  <p className="whitespace-pre-wrap">
                    {booking.exchange_offer?.trim() || 'No exchange offer provided'}
                  </p>
                </DetailField>
                <DetailField label="Requested on">
                  {formatDate(booking.created_at)}
                </DetailField>
              </div>
            </div>

            {booking.status === 'approved' && (
              <div className={theme.successBanner}>
                <h2 className={`${theme.successTitle} mb-2`}>Agreement</h2>
                {!booking.contract_text && (
                  <p className="text-sm text-gray-600 mb-3">
                    Review and accept the agreement below.
                  </p>
                )}
                {booking.contract_text && (
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans mb-4 rounded-2xl">
                    {booking.contract_text}
                  </pre>
                )}
                <p className="text-xs text-gray-500 mb-3">
                  Borrower: {booking.borrower_signed_at ? 'Signed' : 'Pending'} · Owner:{' '}
                  {booking.owner_signed_at ? 'Signed' : 'Pending'}
                </p>
                {!userSigned && (
                  <button
                    type="button"
                    onClick={() => handleAction('sign')}
                    disabled={submitting}
                    className={`${theme.primaryBtn} disabled:opacity-50`}
                  >
                    I agree
                  </button>
                )}
                {userSigned && !otherSigned && (
                  <p className="text-sm text-gray-600">Waiting for the other party to sign.</p>
                )}
              </div>
            )}

            {bookingChatEligible(booking) && (
              <Link
                href={messagesChatHref(booking.booking_id)}
                className={`block text-center text-sm px-6 py-3 rounded-2xl font-semibold border-2 ${
                  isOwner
                    ? 'bg-white text-host-cream-accent border-host-cream hover:bg-host-cream-light/50'
                    : 'btn-outline'
                }`}
              >
                Open chat
              </Link>
            )}

            {canRateBooking(
              booking.status,
              booking.end_date,
              booking.borrower_signed_at,
              booking.owner_signed_at
            ) && !ratingMessage && (
              <div className={panelClass()}>
                <h2 className="font-semibold text-dark mb-3">Rate after visit</h2>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className={`${theme.inputClass} mb-3 w-full`}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{n} stars</option>
                  ))}
                </select>
                <textarea
                  placeholder="Optional comment"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className={`${theme.inputClass} resize-y mb-3 w-full`}
                  rows={2}
                />
                <button
                  type="button"
                  onClick={handleRate}
                  disabled={submitting}
                  className={`${theme.primaryBtn} disabled:opacity-50`}
                >
                  Submit rating
                </button>
              </div>
            )}
            {ratingMessage && (
              <p className={`text-sm text-center ${isOwner ? 'text-host-cream-accent' : 'text-primary'}`}>
                {ratingMessage}
              </p>
            )}

            {actionError && <p className="text-red-600 text-sm text-center">{actionError}</p>}

            {isOwner && booking.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleAction('approve')}
                  disabled={submitting}
                  className="btn-host text-sm px-4 py-3 flex-1 rounded-2xl disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('reject')}
                  disabled={submitting}
                  className="btn-host-outline text-sm px-4 py-3 flex-1 rounded-2xl disabled:opacity-50"
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
