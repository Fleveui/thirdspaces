/**
 * Find mode — intro search hub and available spaces results.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { SearchBar } from '@/components/SearchBar'
import { CategoryChips } from '@/components/CategoryChips'
import { SpaceCard } from '@/components/SpaceCard'
import { FilterPanel } from '@/components/FilterPanel'
import { SparkleIcon } from '@/components/SparkleIcon'
import { MyBookingRequestCard } from '@/components/MyBookingRequestCard'
import { BorrowerBooking } from '@/lib/bookings'
import { useAuth } from '@/lib/auth'
import {
  fetchFavorites,
  addFavorite,
  removeFavorite,
  favoriteIdsFromList,
} from '@/lib/favorites'
import {
  SPACE_CATEGORIES,
  SpaceListing,
  SpaceFilters,
  emptyFilters,
  buildSpacesQuery,
} from '@/lib/spaces'

type FindView = 'intro' | 'results'

function FindContent() {
  const router = useRouter()
  const { authFetch } = useAuth()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const [view, setView] = useState<FindView>('intro')
  const [spaces, setSpaces] = useState<SpaceListing[]>([])
  const [borrowerBookings, setBorrowerBookings] = useState<BorrowerBooking[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [borrowerLoading, setBorrowerLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [borrowerError, setBorrowerError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState<SpaceFilters>(emptyFilters())

  const fetchSpaces = useCallback(async () => {
    setLoading(true)
    try {
      const merged: SpaceFilters = {
        ...filters,
        location: searchText.trim() || filters.location,
      }
      const qs = buildSpacesQuery(merged).toString()
      const response = await fetch(`${apiUrl}/api/spaces${qs ? `?${qs}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!response.ok) throw new Error('Failed to load spaces')
      setSpaces(await response.json())
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, filters, searchText, token])

  const fetchBorrowerBookings = useCallback(async () => {
    try {
      const response = await fetch(`${apiUrl}/api/bookings/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to fetch your bookings')
      }
      setBorrowerBookings(await response.json())
      setBorrowerError(null)
    } catch (err) {
      setBorrowerError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setBorrowerLoading(false)
    }
  }, [apiUrl, token])

  useEffect(() => {
    if (view === 'results') {
      fetchSpaces()
    }
  }, [view, fetchSpaces])

  useEffect(() => {
    if (token) fetchBorrowerBookings()
  }, [token, fetchBorrowerBookings])

  const fetchFavoriteIds = useCallback(async () => {
    if (!token) return
    try {
      const favorites = await fetchFavorites(authFetch, apiUrl)
      setFavoriteIds(favoriteIdsFromList(favorites))
    } catch {
      setFavoriteIds(new Set())
    }
  }, [apiUrl, authFetch, token])

  useEffect(() => {
    if (view === 'results' && token) {
      fetchFavoriteIds()
    }
  }, [view, token, fetchFavoriteIds])

  const toggleFavorite = async (spaceId: string) => {
    const isFav = favoriteIds.has(spaceId)
    try {
      if (isFav) {
        await removeFavorite(authFetch, apiUrl, spaceId)
        setFavoriteIds((prev) => {
          const next = new Set(prev)
          next.delete(spaceId)
          return next
        })
      } else {
        await addFavorite(authFetch, apiUrl, spaceId)
        setFavoriteIds((prev) => new Set(prev).add(spaceId))
      }
    } catch {
      // ignore toggle errors on card
    }
  }

  const goToResults = (category?: string) => {
    if (category !== undefined) {
      setFilters((f) => ({ ...f, category }))
    }
    setView('results')
  }

  return (
    <AppShell mode="find" variant="minimal">
      {view === 'intro' ? (
        <div className="max-w-xl mx-auto">
          <PageHeader title="Find a space" onBack={() => router.push('/dashboard')} />

          <div className="text-center mb-8">
            <SparkleIcon size={28} className="text-primary mx-auto mb-4" />
            <p className="text-gray-500 text-sm">What kind of space are you looking for?</p>
          </div>

          <div className="space-y-6 mb-8">
            <SearchBar
              value={searchText}
              onChange={setSearchText}
              onSubmit={() => goToResults()}
            />

            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
                Do you want to filter the results?
              </p>
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-3xl bg-primary-light/50 text-dark hover:bg-primary-light transition-colors"
              >
                <span className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 6h16M6 12h12M8 18h8" />
                  </svg>
                  Apply filters
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <button type="button" onClick={() => goToResults()} className="btn-primary w-full rounded-3xl py-4">
              Browse all spaces
            </button>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Categories</p>
            <CategoryChips
              categories={SPACE_CATEGORIES}
              selected={filters.category}
              onSelect={(cat) => goToResults(cat)}
            />
          </div>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <PageHeader
            title="Available spaces"
            onBack={() => setView('intro')}
            rightAction={
              <button
                type="button"
                onClick={() => setShowFilters(true)}
                className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center text-primary"
                aria-label="Open filters"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M6 12h12M8 18h8" />
                </svg>
              </button>
            }
          />

          <section className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-5 mb-6 max-w-xl mx-auto">
            <h2 className="font-semibold text-white mb-4">My booking requests</h2>
            {borrowerLoading ? (
              <p className="text-white/80 text-sm">Loading your bookings...</p>
            ) : borrowerError ? (
              <p className="text-red-100 text-sm">{borrowerError}</p>
            ) : borrowerBookings.length === 0 ? (
              <p className="text-white/80 text-sm">No bookings yet. Pick a space below to get started.</p>
            ) : (
              <ul className="space-y-3">
                {borrowerBookings.map((booking) => (
                  <li key={booking.booking_id}>
                    <MyBookingRequestCard booking={booking} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {loading ? (
            <p className="text-gray-600 text-sm text-center py-12">Loading spaces...</p>
          ) : error ? (
            <p className="text-red-600 text-sm text-center py-12">{error}</p>
          ) : spaces.length === 0 ? (
            <p className="text-gray-600 text-center py-12">No spaces found. Try adjusting your filters.</p>
          ) : (
            <div className="space-y-3 mb-10 max-w-xl mx-auto">
              {spaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
                  apiUrl={apiUrl}
                  layout="row"
                  isFavorite={favoriteIds.has(space.id)}
                  onToggleFavorite={() => toggleFavorite(space.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <FilterPanel
        open={showFilters}
        filters={filters}
        onChange={setFilters}
        onClose={() => setShowFilters(false)}
        onApply={() => {
          setView('results')
          fetchSpaces()
        }}
      />
    </AppShell>
  )
}

export default function FindPage() {
  return (
    <ProtectedRoute>
      <FindContent />
    </ProtectedRoute>
  )
}
