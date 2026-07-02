/**
 * Dashboard Page
 * → see app-requirements.md #7 & #8 (User Dashboard & Owner Dashboard)
 * → see DECISIONS.md #8 (Dashboard Redirect)
 *
 * Shows different content based on account_type:
 *   - user: upcoming bookings, pending requests, saved spaces, messages
 *   - space_owner: their spaces, booking requests, availability, messages
 *
 * Protected: requires authentication (uses ProtectedRoute wrapper)
 */

'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useState, useEffect, useCallback } from 'react'
import {
  OwnerBooking,
  formatDateRange,
  exchangeOfferPreview,
} from '@/lib/bookings'
import { LogoMark } from '@/components/LogoMark'

interface SpaceListing {
  id: string
  name: string
  location: string | null
}

function BookingGroup({
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

function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<SpaceListing[]>([])
  const [bookings, setBookings] = useState<OwnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [actionBookingId, setActionBookingId] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const isSpaceOwner = user?.account_type === 'space_owner'

  const fetchBookings = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${apiUrl}/api/bookings/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to fetch booking requests')
      }
      const data = await response.json()
      setBookings(data)
      setBookingsError(null)
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBookingsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSpaceOwner) {
      setLoading(false)
      setBookingsLoading(false)
      return
    }

    const fetchListings = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`${apiUrl}/api/spaces/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || 'Failed to fetch your listings')
        }
        const data = await response.json()
        setListings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
    fetchBookings()
  }, [isSpaceOwner, fetchBookings])

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    setActionBookingId(bookingId)
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
      await fetchBookings()
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setActionBookingId(null)
    }
  }

  const pendingBookings = bookings.filter((b) => b.status === 'pending')
  const approvedBookings = bookings.filter((b) => b.status === 'approved')
  const rejectedBookings = bookings.filter((b) => b.status === 'rejected')

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <LogoMark size={40} />
            <div>
              <h1 className="text-xl font-bold text-primary">
                Match for Space
              </h1>
              <p className="text-gray-600 text-sm">
                {isSpaceOwner ? 'Space Owner Dashboard' : 'User Dashboard'}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            {isSpaceOwner && (
              <Link href="/spaces/new" className="btn-primary">
                List a Space
              </Link>
            )}
            <button onClick={handleLogout} className="btn-secondary">
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="card mb-8 max-w-md">
          <h2 className="text-lg font-semibold text-dark mb-4">You're successfully logged in!</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Username</p>
              <p className="font-medium text-dark">{user?.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-dark">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Type</p>
              <p className="font-medium text-dark capitalize">
                {isSpaceOwner ? 'Space Owner' : 'User'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isSpaceOwner ? (
            <>
              <div className="card md:col-span-2">
                <h3 className="font-semibold text-dark mb-4">Your Listings</h3>
                {loading ? (
                  <p className="text-gray-600 text-sm">Loading your listings...</p>
                ) : error ? (
                  <p className="text-red-600 text-sm">{error}</p>
                ) : listings.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    You have not listed any spaces yet.{' '}
                    <Link href="/spaces/new" className="text-primary hover:underline">
                      List a Space
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {listings.map((listing) => (
                      <li key={listing.id} className="py-3 first:pt-0 last:pb-0">
                        <Link
                          href={`/spaces/${listing.id}`}
                          className="block hover:bg-primary-light -mx-2 px-2 rounded-2xl transition-colors"
                        >
                          <p className="font-medium text-dark">{listing.name}</p>
                          <p className="text-sm text-gray-600">{listing.location || 'No location set'}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="card md:col-span-2">
                <h3 className="font-semibold text-dark mb-4">Booking Requests</h3>
                {bookingsLoading ? (
                  <p className="text-gray-600 text-sm">Loading booking requests...</p>
                ) : bookingsError ? (
                  <p className="text-red-600 text-sm">{bookingsError}</p>
                ) : bookings.length === 0 ? (
                  <p className="text-gray-600 text-sm">No booking requests yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <BookingGroup
                      title="Pending Approval"
                      bookings={pendingBookings}
                      showActions
                      onApprove={(id) => handleBookingAction(id, 'approve')}
                      onReject={(id) => handleBookingAction(id, 'reject')}
                      actionBookingId={actionBookingId}
                    />
                    <BookingGroup title="Confirmed" bookings={approvedBookings} />
                    <BookingGroup title="Rejected" bookings={rejectedBookings} />
                  </div>
                )}
              </div>

              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Availability Calendar</h3>
                <p className="text-gray-600 text-sm">Coming soon: manage space availability</p>
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Messages</h3>
                <p className="text-gray-600 text-sm">Coming soon: chat with users</p>
              </div>
            </>
          ) : (
            <>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Upcoming Bookings</h3>
                <p className="text-gray-600 text-sm">Coming soon: view your confirmed bookings</p>
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Pending Requests</h3>
                <p className="text-gray-600 text-sm">Coming soon: track requests awaiting approval</p>
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Saved Spaces</h3>
                <p className="text-gray-600 text-sm">Coming soon: your favorite spaces</p>
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Messages</h3>
                <p className="text-gray-600 text-sm">Coming soon: chat with space owners</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
