/**
 * Host mode — intro hub and listings view (mirrors Find a space layout).
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { SpaceCard } from '@/components/SpaceCard'
import { SparkleIcon } from '@/components/SparkleIcon'
import { SpaceListing } from '@/lib/spaces'
import { countBookingsBySpace, OwnerBooking } from '@/lib/bookings'
import { useAuth, SessionExpiredError } from '@/lib/auth'

type HostView = 'intro' | 'listings'

function HostContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { authFetch } = useAuth()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const [view, setView] = useState<HostView>(() =>
    searchParams.get('view') === 'listings' ? 'listings' : 'intro'
  )
  const [listings, setListings] = useState<SpaceListing[]>([])
  const [fullSpaces, setFullSpaces] = useState<SpaceListing[]>([])
  const [requestCountBySpace, setRequestCountBySpace] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadListings = useCallback(async () => {
    setLoading(true)
    try {
      const [mineRes, bookingsRes] = await Promise.all([
        authFetch(`${apiUrl}/api/spaces/mine`),
        authFetch(`${apiUrl}/api/bookings/mine`),
      ])

      if (!mineRes.ok) {
        const data = await mineRes.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to fetch your listings')
      }

      const summaries = await mineRes.json()
      setListings(summaries)

      if (bookingsRes.ok) {
        const bookings: OwnerBooking[] = await bookingsRes.json()
        setRequestCountBySpace(countBookingsBySpace(bookings))
      } else {
        setRequestCountBySpace({})
      }

      const detailResponses = await Promise.all(
        summaries.map((s: { id: string }) =>
          fetch(`${apiUrl}/api/spaces/${s.id}`).then((r) => r.json())
        )
      )
      setFullSpaces(detailResponses)
      setError(null)
    } catch (err) {
      if (err instanceof SessionExpiredError) {
        router.push('/')
        return
      }
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, authFetch, router])

  useEffect(() => {
    if (view === 'listings') {
      loadListings()
    }
  }, [view, loadListings])

  const goToListings = () => {
    setView('listings')
    router.push('/host?view=listings')
  }

  return (
    <AppShell mode="host" variant="minimal">
      {view === 'intro' ? (
        <div className="max-w-xl mx-auto">
          <PageHeader title="My spaces" onBack={() => router.push('/dashboard')} />

          <div className="text-center mb-8">
            <SparkleIcon size={28} className="text-host-cream-accent mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Ready to share your space with local artists?</p>
          </div>

          <div className="space-y-6 mb-8">
            <button type="button" onClick={goToListings} className="btn-host w-full rounded-3xl py-4">
              View my listings
            </button>

            <Link href="/spaces/new" className="btn-host-outline w-full block text-center rounded-3xl py-4">
              Add a space
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <PageHeader
            title="My spaces"
            onBack={() => {
              setView('intro')
              router.push('/host')
            }}
            rightAction={
              <Link
                href="/spaces/new"
                className="w-10 h-10 rounded-full bg-host-cream flex items-center justify-center text-host-cream-accent"
                aria-label="Add a space"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </Link>
            }
          />

          {loading ? (
            <p className="text-gray-600 text-sm text-center py-12">Loading your listings...</p>
          ) : error ? (
            <p className="text-red-600 text-sm text-center py-12">{error}</p>
          ) : listings.length === 0 ? (
            <p className="text-gray-600 text-center py-12">
              You have not listed any spaces yet.{' '}
              <Link href="/spaces/new" className="text-host-cream-accent hover:underline">
                Add your first space
              </Link>
            </p>
          ) : (
            <div className="space-y-3 mb-10 max-w-xl mx-auto">
              {fullSpaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  apiUrl={apiUrl}
                  layout="row"
                  accent="host"
                  requestCount={requestCountBySpace[space.id] ?? 0}
                />
              ))}
            </div>
          )}
        </div>
      )}
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
