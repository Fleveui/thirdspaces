/**
 * Incoming booking requests — host view.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { IncomingRequestCard } from '@/components/IncomingRequestCard'
import { OwnerBooking, isVisitPast } from '@/lib/bookings'
import { hostRequestsBackHref } from '@/lib/hostNavigation'

function HostRequestsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const [ownerBookings, setOwnerBookings] = useState<OwnerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, token])

  useEffect(() => {
    if (token) fetchOwnerBookings()
  }, [token, fetchOwnerBookings])

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
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setActionBookingId(null)
    }
  }

  const pending = ownerBookings.filter((b) => b.status === 'pending')
  const confirmed = ownerBookings.filter((b) => b.status === 'approved')
  const confirmedUpcoming = confirmed.filter((b) => !isVisitPast(b.end_date))
  const confirmedPast = confirmed.filter((b) => isVisitPast(b.end_date))
  const rejected = ownerBookings.filter((b) => b.status === 'rejected')

  return (
    <AppShell mode="host" variant="minimal">
      <div className="max-w-xl mx-auto">
        <PageHeader
          title="Incoming requests"
          onBack={() => router.push(hostRequestsBackHref(searchParams.get('space_id')))}
        />

        <p className="text-host-cream-accent/80 text-sm text-center mb-8">
          Artists interested in your space will appear here.
        </p>

        {loading ? (
          <p className="text-gray-600 text-sm text-center py-8">Loading requests...</p>
        ) : error ? (
          <p className="text-red-600 text-sm text-center py-8">{error}</p>
        ) : ownerBookings.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">No booking requests yet.</p>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-host-cream-accent uppercase tracking-wide mb-1">
                  Pending
                </h3>
                {pending.map((booking) => (
                  <IncomingRequestCard
                    key={booking.booking_id}
                    booking={booking}
                    showActions
                    onApprove={(id) => handleBookingAction(id, 'approve')}
                    onReject={(id) => handleBookingAction(id, 'reject')}
                    actionBookingId={actionBookingId}
                  />
                ))}
              </section>
            )}

            {confirmedUpcoming.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">
                  Upcoming
                </h3>
                <div className="space-y-3">
                  {confirmedUpcoming.map((booking) => (
                    <IncomingRequestCard key={booking.booking_id} booking={booking} />
                  ))}
                </div>
              </section>
            )}

            {confirmedPast.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">
                  Past visits
                </h3>
                <div className="space-y-3">
                  {confirmedPast.map((booking) => (
                    <IncomingRequestCard key={booking.booking_id} booking={booking} />
                  ))}
                </div>
              </section>
            )}

            {rejected.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-3">
                  Rejected
                </h3>
                <div className="space-y-3">
                  {rejected.map((booking) => (
                    <IncomingRequestCard key={booking.booking_id} booking={booking} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default function HostRequestsPage() {
  return (
    <ProtectedRoute>
      <HostRequestsContent />
    </ProtectedRoute>
  )
}
