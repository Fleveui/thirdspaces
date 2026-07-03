/**
 * My booking requests — borrower view.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { MyBookingRequestCard } from '@/components/MyBookingRequestCard'
import { BorrowerBooking } from '@/lib/bookings'

function FindRequestsContent() {
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const [bookings, setBookings] = useState<BorrowerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBookings = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/bookings/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to fetch your bookings')
      }
      setBookings(await response.json())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, token])

  useEffect(() => {
    if (token) fetchBookings()
  }, [token, fetchBookings])

  const pending = bookings.filter((b) => b.status === 'pending')
  const confirmed = bookings.filter((b) => b.status === 'approved')
  const past = bookings.filter((b) => b.status === 'rejected')

  return (
    <AppShell mode="find" variant="minimal">
      <div className="max-w-xl mx-auto">
        <PageHeader title="My booking requests" onBack={() => router.push('/dashboard')} />

        <p className="text-gray-500 text-sm text-center mb-8">
          Spaces you have requested will appear here.
        </p>

        {loading ? (
          <p className="text-gray-600 text-sm text-center py-8">Loading your bookings...</p>
        ) : error ? (
          <p className="text-red-600 text-sm text-center py-8">{error}</p>
        ) : bookings.length === 0 ? (
          <p className="text-gray-600 text-sm text-center py-8">
            No bookings yet.{' '}
            <Link href="/find" className="text-primary hover:underline">
              Browse spaces to get started.
            </Link>
          </p>
        ) : (
          <div className="space-y-6">
            {pending.length > 0 && (
              <section className="space-y-3">
                {pending.map((booking) => (
                  <MyBookingRequestCard key={booking.booking_id} booking={booking} />
                ))}
              </section>
            )}

            {confirmed.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Confirmed
                </h3>
                <div className="space-y-3">
                  {confirmed.map((booking) => (
                    <MyBookingRequestCard key={booking.booking_id} booking={booking} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Past
                </h3>
                <div className="space-y-3">
                  {past.map((booking) => (
                    <MyBookingRequestCard key={booking.booking_id} booking={booking} />
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

export default function FindRequestsPage() {
  return (
    <ProtectedRoute>
      <FindRequestsContent />
    </ProtectedRoute>
  )
}
