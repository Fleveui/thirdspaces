/**
 * Host mode — manage listings and incoming booking requests.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { OwnerBookingGroup } from '@/components/BookingGroups'
import { OwnerBooking } from '@/lib/bookings'

interface SpaceListing {
  id: string
  name: string
  location: string | null
}

function HostContent() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const [listings, setListings] = useState<SpaceListing[]>([])
  const [ownerBookings, setOwnerBookings] = useState<OwnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [bookingsLoading, setBookingsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingsError, setBookingsError] = useState<string | null>(null)
  const [actionBookingId, setActionBookingId] = useState<string | null>(null)

  const fetchOwnerBookings = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/bookings/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to fetch booking requests')
      }
      setOwnerBookings(await response.json())
      setBookingsError(null)
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBookingsLoading(false)
    }
  }, [apiUrl, token])

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/spaces/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || 'Failed to fetch your listings')
        }
        setListings(await response.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (token) {
      fetchListings()
      fetchOwnerBookings()
    }
  }, [apiUrl, token, fetchOwnerBookings])

  const handleBookingAction = async (bookingId: string, action: 'approve' | 'reject') => {
    setActionBookingId(bookingId)
    try {
      const response = await fetch(`${apiUrl}/api/bookings/${bookingId}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || `Failed to ${action} booking`)
      }
      await fetchOwnerBookings()
    } catch (err) {
      setBookingsError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setActionBookingId(null)
    }
  }

  const pending = ownerBookings.filter((b) => b.status === 'pending')
  const approved = ownerBookings.filter((b) => b.status === 'approved')
  const rejected = ownerBookings.filter((b) => b.status === 'rejected')

  return (
    <AppShell mode="host">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-dark">My spaces</h1>
          <p className="text-gray-600 text-sm mt-1">List your space and manage incoming requests</p>
        </div>
        <Link href="/spaces/new" className="btn-primary text-sm">
          Add a space
        </Link>
      </div>

      <div className="space-y-6">
        <div className="card">
          <h2 className="font-semibold text-dark mb-4">Your listings</h2>
          {loading ? (
            <p className="text-gray-600 text-sm">Loading your listings...</p>
          ) : error ? (
            <p className="text-red-600 text-sm">{error}</p>
          ) : listings.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-600 text-sm mb-4">
                You have not listed any spaces yet. Share your space with the community!
              </p>
              <Link href="/spaces/new" className="btn-primary text-sm inline-block">
                Add your first space
              </Link>
            </div>
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

        <div className="card">
          <h2 className="font-semibold text-dark mb-4">Incoming booking requests</h2>
          {bookingsLoading ? (
            <p className="text-gray-600 text-sm">Loading booking requests...</p>
          ) : bookingsError ? (
            <p className="text-red-600 text-sm">{bookingsError}</p>
          ) : ownerBookings.length === 0 ? (
            <p className="text-gray-600 text-sm">No booking requests yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <OwnerBookingGroup
                title="Pending approval"
                bookings={pending}
                showActions
                onApprove={(id) => handleBookingAction(id, 'approve')}
                onReject={(id) => handleBookingAction(id, 'reject')}
                actionBookingId={actionBookingId}
              />
              <OwnerBookingGroup title="Confirmed" bookings={approved} />
              <OwnerBookingGroup title="Rejected" bookings={rejected} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function HostPage() {
  return (
    <ProtectedRoute>
      <HostContent />
    </ProtectedRoute>
  )
}
