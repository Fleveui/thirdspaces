/**
 * Booking Detail Page
 * → see app-requirements.md #4–5 (Booking Request & Owner Approval)
 *
 * Space owners view booking details and approve or reject pending requests.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  OwnerBooking,
  formatDate,
  formatDateRange,
  statusLabel,
} from '@/lib/bookings'

function BookingDetailContent() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<OwnerBooking | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && user && user.account_type !== 'space_owner') {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (authLoading || !user || user.account_type !== 'space_owner') {
      return
    }

    const fetchBooking = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
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
          throw new Error(data.detail || 'Failed to load booking details')
        }

        const data = await response.json()
        setBooking(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBooking()
  }, [authLoading, user, bookingId])

  const handleAction = async (action: 'approve' | 'reject') => {
    setSubmitting(true)
    setActionError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || `Failed to ${action} booking`)
      }

      const data = await response.json()
      setBooking(data)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  if (!authLoading && user && user.account_type !== 'space_owner') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="font-medium text-primary hover:underline">
            Back to dashboard
          </Link>
        </div>

        {loading ? (
          <div className="card">
            <p className="text-gray-600 text-sm">Loading booking details...</p>
          </div>
        ) : notFound ? (
          <div className="card">
            <h1 className="text-2xl font-bold text-dark mb-2">Booking not found</h1>
            <p className="text-gray-600 text-sm">
              This booking may have been removed or you do not have access to it.
            </p>
          </div>
        ) : error ? (
          <div className="card">
            <h1 className="text-2xl font-bold text-dark mb-2">Something went wrong</h1>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : booking ? (
          <div className="card">
            <h1 className="text-2xl font-bold text-primary mb-2">Booking Request</h1>
            <p className="text-sm text-gray-600 mb-6">{statusLabel(booking.status)}</p>

            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-medium text-gray-600 mb-1">Space</h2>
                <Link
                  href={`/spaces/${booking.space_id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {booking.space_name}
                </Link>
                <p className="text-dark text-sm mt-1">
                  {booking.space_location || 'No location set'}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-600 mb-1">Borrower</h2>
                <p className="text-dark">{booking.borrower_name}</p>
                {booking.borrower_email && (
                  <p className="text-dark text-sm">{booking.borrower_email}</p>
                )}
              </div>

              <div>
                <h2 className="text-sm font-medium text-gray-600 mb-1">Dates</h2>
                <p className="text-dark">{formatDateRange(booking.start_date, booking.end_date)}</p>
              </div>

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

            {actionError && (
              <p className="text-red-600 text-sm mt-6">{actionError}</p>
            )}

            {booking.status === 'pending' && (
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
      </main>
    </div>
  )
}

export default function BookingDetailPage() {
  return (
    <ProtectedRoute>
      <BookingDetailContent />
    </ProtectedRoute>
  )
}
