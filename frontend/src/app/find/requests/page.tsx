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
import { BorrowerBooking, isVisitPast } from '@/lib/bookings'

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
  const rejected = bookings.filter((b) => b.status === 'rejected')
  const approved = bookings.filter((b) => b.status === 'approved')
  const upcoming = approved.filter((b) => !isVisitPast(b.end_date))
  const past = approved.filter((b) => isVisitPast(b.end_date))

  const renderList = (items: BorrowerBooking[]) => (
    <ul className="space-y-3">
      {items.map((booking) => (
        <li key={booking.booking_id}>
          <MyBookingRequestCard booking={booking} />
        </li>
      ))}
    </ul>
  )

  return (
    <AppShell mode="find" variant="minimal">
      <div className="max-w-xl mx-auto">
        <PageHeader title="My booking requests" onBack={() => router.push('/dashboard')} />

        <section className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-5 mb-6">
          <h2 className="font-semibold text-white mb-4">My booking requests</h2>
          {loading ? (
            <p className="text-white/80 text-sm">Loading your bookings...</p>
          ) : error ? (
            <p className="text-red-100 text-sm">{error}</p>
          ) : bookings.length === 0 ? (
            <p className="text-white/80 text-sm">
              No bookings yet.{' '}
              <Link href="/find" className="text-white underline hover:no-underline">
                Browse spaces to get started.
              </Link>
            </p>
          ) : (
            <div className="space-y-5">
              {pending.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-2">Pending</h3>
                  {renderList(pending)}
                </div>
              )}
              {upcoming.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-2">Upcoming</h3>
                  {renderList(upcoming)}
                </div>
              )}
              {past.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-2">Past visits</h3>
                  {renderList(past)}
                </div>
              )}
              {rejected.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-white/80 uppercase tracking-wide mb-2">Rejected</h3>
                  {renderList(rejected)}
                </div>
              )}
            </div>
          )}
        </section>
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
