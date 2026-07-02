/**
 * Find mode — search spaces and track your booking requests.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { BorrowerBookingGroup } from '@/components/BookingGroups'
import { BorrowerBooking } from '@/lib/bookings'
import { SpaceListing, resolveImageUrl, outdoorLabel } from '@/lib/spaces'

const CATEGORIES = ['Loft', 'Terrazza', 'Studio', 'Orto', 'Ufficio']

function FindContent() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const [spaces, setSpaces] = useState<SpaceListing[]>([])
  const [borrowerBookings, setBorrowerBookings] = useState<BorrowerBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [borrowerLoading, setBorrowerLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [borrowerError, setBorrowerError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    is_outdoor: '',
    min_area: '',
    max_area: '',
    location: '',
    availability: '',
  })

  const fetchSpaces = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category) params.set('category', filters.category)
      if (filters.is_outdoor !== '') params.set('is_outdoor', filters.is_outdoor)
      if (filters.min_area) params.set('min_area', filters.min_area)
      if (filters.max_area) params.set('max_area', filters.max_area)
      if (filters.location) params.set('location', filters.location)
      if (filters.availability) params.set('availability', filters.availability)

      const qs = params.toString()
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
  }, [apiUrl, filters, token])

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
    fetchSpaces()
  }, [fetchSpaces])

  useEffect(() => {
    if (token) fetchBorrowerBookings()
  }, [token, fetchBorrowerBookings])

  const pending = borrowerBookings.filter((b) => b.status === 'pending')
  const approved = borrowerBookings.filter((b) => b.status === 'approved')
  const past = borrowerBookings.filter((b) => b.status === 'rejected')

  return (
    <AppShell mode="find">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-dark">Find a space</h1>
        <p className="text-gray-600 text-sm mt-1">Browse and book community spaces</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="btn-outline text-sm"
        >
          {showFilters ? 'Hide filters' : 'Filter search'}
        </button>
      </div>

      {showFilters && (
        <div className="card mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}
            className="input"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={filters.is_outdoor}
            onChange={(e) => setFilters((f) => ({ ...f, is_outdoor: e.target.value }))}
            className="input"
          >
            <option value="">Indoor or outdoor</option>
            <option value="false">Indoor</option>
            <option value="true">Outdoor</option>
          </select>
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
            className="input"
          />
          <input
            type="number"
            placeholder="Min area (m²)"
            value={filters.min_area}
            onChange={(e) => setFilters((f) => ({ ...f, min_area: e.target.value }))}
            className="input"
          />
          <input
            type="number"
            placeholder="Max area (m²)"
            value={filters.max_area}
            onChange={(e) => setFilters((f) => ({ ...f, max_area: e.target.value }))}
            className="input"
          />
          <input
            type="text"
            placeholder="Availability"
            value={filters.availability}
            onChange={(e) => setFilters((f) => ({ ...f, availability: e.target.value }))}
            className="input"
          />
          <button type="button" onClick={fetchSpaces} className="btn-primary text-sm md:col-span-3">
            Apply filters
          </button>
        </div>
      )}

      <section className="mb-10">
        {loading ? (
          <p className="text-gray-600 text-sm">Loading spaces...</p>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : spaces.length === 0 ? (
          <p className="text-gray-600">No spaces found. Try adjusting your filters.</p>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">Sorted by relevance</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {spaces.map((space) => {
                const img = resolveImageUrl(space.image_url, apiUrl)
                return (
                  <Link
                    key={space.id}
                    href={`/spaces/${space.id}`}
                    className="card hover:shadow-md transition-shadow block overflow-hidden p-0"
                  >
                    <div className="h-40 bg-primary-light flex items-center justify-center">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={space.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary text-sm">No photo</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h2 className="font-semibold text-dark">{space.name}</h2>
                      <p className="text-sm text-gray-600">{space.location || 'Location TBD'}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {outdoorLabel(space.is_outdoor)}
                        {space.area_m2 ? ` · ${space.area_m2} m²` : ''}
                      </p>
                      {space.availability && (
                        <p className="text-xs text-primary mt-1">{space.availability}</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2 className="font-semibold text-dark mb-4">My booking requests</h2>
        {borrowerLoading ? (
          <p className="text-gray-600 text-sm">Loading your bookings...</p>
        ) : borrowerError ? (
          <p className="text-red-600 text-sm">{borrowerError}</p>
        ) : borrowerBookings.length === 0 ? (
          <p className="text-gray-600 text-sm">No bookings yet. Pick a space above to get started.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <BorrowerBookingGroup title="Pending approval" bookings={pending} />
            <BorrowerBookingGroup title="Upcoming" bookings={approved} />
            <BorrowerBookingGroup title="Past" bookings={past} />
          </div>
        )}
      </section>
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
