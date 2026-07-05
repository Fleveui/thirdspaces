/**
 * Space Detail Page with photo gallery and Book Now form.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { countBookingsBySpace, OwnerBooking } from '@/lib/bookings'
import { hostRequestsHref } from '@/lib/hostNavigation'
import { addFavorite, fetchFavoriteStatus, removeFavorite } from '@/lib/favorites'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { BookmarkButton } from '@/components/BookmarkButton'
import {
  SpaceListing,
  resolveImageUrl,
  outdoorLabel,
  availabilityBadge,
  EXCHANGE_OPTIONS,
  LISTING_DEFAULTS,
  SPACE_CATEGORIES,
} from '@/lib/spaces'
import { accentClasses } from '@/lib/theme'

function displayText(value: string | null, fallback: string): string {
  return value?.trim() ? value : fallback
}

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

function parseExchangePreferences(value: string | null): string[] {
  if (!value?.trim()) return []
  return value.split(';').map((item) => item.trim()).filter(Boolean)
}

function ExchangePreferencesList({
  selected,
  accent,
}: {
  selected: string[]
  accent: 'find' | 'host'
}) {
  const selectedSet = new Set(selected)
  const theme = accentClasses(accent)
  const options = [
    ...EXCHANGE_OPTIONS,
    ...selected.filter((item) => !EXCHANGE_OPTIONS.includes(item as (typeof EXCHANGE_OPTIONS)[number])),
  ]
  const selectedBorder = theme.selectedBorder
  const selectedDot = theme.selectedDot
  const unselectedBorder = 'border-gray-200'

  return (
    <ul className="space-y-2">
      {options.map((option) => {
        const isSelected = selectedSet.has(option)
        return (
          <li
            key={option}
            className={`flex items-center gap-3 p-3 rounded-2xl border text-sm ${
              isSelected ? selectedBorder : unselectedBorder
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                isSelected ? selectedDot : 'border-gray-300'
              }`}
            >
              {isSelected && <span className="w-2.5 h-2.5 rounded-full bg-white" />}
            </span>
            {option}
          </li>
        )
      })}
    </ul>
  )
}

function SpaceDetailContent() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user, authFetch } = useAuth()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const [space, setSpace] = useState<SpaceListing | null>(null)
  const [requestCount, setRequestCount] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showBookForm, setShowBookForm] = useState(false)
  const [bookSuccess, setBookSuccess] = useState(false)
  const [bookError, setBookError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [bookForm, setBookForm] = useState({
    start_date: '',
    end_date: '',
    intended_use: '',
    exchange_offer: '',
    accepted_terms: false,
    accepted_safety: false,
    accepted_privacy: false,
  })

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/spaces/${id}`)
        if (response.status === 404) {
          setNotFound(true)
          return
        }
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || 'Failed to load space details')
        }
        setSpace(await response.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchSpace()
  }, [apiUrl, id])

  useEffect(() => {
    if (!user || !space || user.id !== space.owner_id) {
      setRequestCount(0)
      return
    }

    const fetchRequestCount = async () => {
      try {
        const response = await authFetch(`${apiUrl}/api/bookings/mine`)
        if (!response.ok) {
          setRequestCount(0)
          return
        }
        const bookings: OwnerBooking[] = await response.json()
        const counts = countBookingsBySpace(bookings)
        setRequestCount(counts[id] ?? 0)
      } catch {
        setRequestCount(0)
      }
    }

    fetchRequestCount()
  }, [apiUrl, authFetch, id, user, space])

  useEffect(() => {
    if (!user || !space || user.id === space.owner_id) {
      setIsFavorite(false)
      return
    }

    const loadFavorite = async () => {
      try {
        setIsFavorite(await fetchFavoriteStatus(authFetch, apiUrl, id))
      } catch {
        setIsFavorite(false)
      }
    }

    loadFavorite()
  }, [apiUrl, authFetch, id, user, space])

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await removeFavorite(authFetch, apiUrl, id)
        setIsFavorite(false)
      } else {
        await addFavorite(authFetch, apiUrl, id)
        setIsFavorite(true)
      }
    } catch {
      // keep current state on error
    }
  }

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookForm.accepted_terms || !bookForm.accepted_safety || !bookForm.accepted_privacy) {
      setBookError('You must accept all agreements')
      return
    }
    const token = localStorage.getItem('auth_token')
    if (!token) {
      setBookError('Please log in to book a space')
      return
    }
    setSubmitting(true)
    setBookError(null)
    try {
      const response = await fetch(`${apiUrl}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          space_id: id,
          start_date: new Date(bookForm.start_date).toISOString(),
          end_date: new Date(bookForm.end_date).toISOString(),
          intended_use: bookForm.intended_use,
          exchange_offer: bookForm.exchange_offer || null,
          accepted_terms: true,
        }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to submit booking')
      }
      setBookSuccess(true)
      setShowBookForm(false)
    } catch (err) {
      setBookError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  const photos = space?.photos?.length
    ? space.photos
    : space?.image_url
      ? [{ photo_id: 'main', image_url: space.image_url, position: 0 }]
      : []

  const isOwnSpace = Boolean(user && space && user.id === space.owner_id)
  const shellMode = isOwnSpace ? 'host' : 'find'
  const accent = isOwnSpace ? 'host' : 'find'
  const theme = accentClasses(accent)
  const backHref = isOwnSpace ? '/host?view=listings' : '/find'

  const pageTitle = loading ? 'Space details' : notFound ? 'Not found' : space?.name ?? 'Space details'
  const badge = space ? availabilityBadge(space.availability) : null

  return (
    <AppShell mode={shellMode} variant="minimal">
      <div className="max-w-xl mx-auto">
        <PageHeader
          title={pageTitle}
          onBack={() => router.push(backHref)}
          rightAction={
            !loading && space && !isOwnSpace ? (
              <BookmarkButton
                filled={isFavorite}
                onClick={() => handleToggleFavorite()}
                className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-primary hover:bg-primary-light/60"
                size={20}
              />
            ) : undefined
          }
        />

        {loading ? (
          <p className="text-gray-600 text-sm text-center py-12">Loading space details...</p>
        ) : notFound ? (
          <div className={panelClass()}>
            <h1 className="text-xl font-bold text-dark">Space not found</h1>
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm text-center py-12">{error}</p>
        ) : space ? (
          <>
            {isOwnSpace && requestCount > 0 && (
              <Link
                href={hostRequestsHref(id)}
                className={`flex items-center justify-center gap-2 w-full mb-4 py-3 rounded-2xl text-dark text-sm font-medium transition-colors ${theme.stripBg}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-host-cream-accent shrink-0">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                {requestCount} {requestCount === 1 ? 'request' : 'requests'}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 ml-auto">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            )}

            {photos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 mb-6">
                {photos.map((photo) => {
                  const src = resolveImageUrl(photo.image_url, apiUrl)
                  return (
                    <div key={photo.photo_id} className={`h-36 ${theme.imageBg} rounded-2xl overflow-hidden`}>
                      {src ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={space.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`h-full flex flex-col items-center justify-center ${theme.placeholderText}`}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
                            <path d="M21 16l-5-5L9 18" />
                          </svg>
                          <span className="text-xs mt-2">No photo</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div
                className={`h-48 ${theme.imageBg} rounded-3xl flex flex-col items-center justify-center mb-6 ${theme.placeholderText}`}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
                  <path d="M21 16l-5-5L9 18" />
                </svg>
                <span className="text-sm mt-3 font-medium">No photo</span>
              </div>
            )}

            <div className={`${panelClass()} mb-6`}>
              <h1 className="text-xl font-bold text-dark mb-4">{space.name}</h1>

              <div className="space-y-5">
                <DetailField label="Location">
                  {displayText(space.location, LISTING_DEFAULTS.location)}
                </DetailField>

                <DetailField label="Area (m²)">
                  {space.area_m2 != null ? `${space.area_m2} m²` : `${LISTING_DEFAULTS.areaM2} m²`}
                </DetailField>

                <DetailField label="Time/dates available">
                  {displayText(space.availability, LISTING_DEFAULTS.availability)}
                </DetailField>

                <DetailField label="Max number of people">
                  {space.max_people ?? LISTING_DEFAULTS.maxPeople}
                </DetailField>

                <DetailField label="Category">
                  {space.category ? (
                    <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${theme.categoryBadge}`}>
                      {space.category}
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {SPACE_CATEGORIES.map((cat) => (
                        <span
                          key={cat}
                          className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  )}
                </DetailField>

                <DetailField label="Indoor / Outdoor">
                  {outdoorLabel(space.is_outdoor)}
                </DetailField>

                <DetailField label="Additional info">
                  <p className="whitespace-pre-wrap">
                    {displayText(space.description, LISTING_DEFAULTS.description)}
                  </p>
                </DetailField>

                <DetailField label="Exchange preferences">
                  <ExchangePreferencesList
                    selected={parseExchangePreferences(space.exchange_preferences)}
                    accent={accent}
                  />
                </DetailField>

              </div>

              {badge && !isOwnSpace && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                      badge.variant === 'available'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {badge.label}
                  </span>
                </div>
              )}

              {user && user.id !== space.owner_id && !bookSuccess && (
                <button
                  type="button"
                  onClick={() => setShowBookForm((v) => !v)}
                  className={`${theme.primaryBtn} mt-8 disabled:opacity-50`}
                >
                  Book Now
                </button>
              )}

              {bookSuccess && (
                <div className={theme.successBanner}>
                  <p className={theme.successTitle}>Pending Approval</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Your booking request was sent. Track it on{' '}
                    <Link href="/find" className={theme.link}>
                      Find a space
                    </Link>
                    .
                  </p>
                </div>
              )}
            </div>

            {showBookForm && (
              <div className={panelClass()}>
                <h2 className="text-lg font-semibold text-dark mb-4">Booking request</h2>
                <form onSubmit={handleBookSubmit} className="space-y-4">
                  <input
                    type="date"
                    required
                    value={bookForm.start_date}
                    onChange={(e) => setBookForm((f) => ({ ...f, start_date: e.target.value }))}
                    className={theme.inputClass}
                  />
                  <input
                    type="date"
                    required
                    value={bookForm.end_date}
                    onChange={(e) => setBookForm((f) => ({ ...f, end_date: e.target.value }))}
                    className={theme.inputClass}
                  />
                  <textarea
                    required
                    placeholder="Intended use"
                    value={bookForm.intended_use}
                    onChange={(e) => setBookForm((f) => ({ ...f, intended_use: e.target.value }))}
                    className={`${theme.inputClass} resize-y`}
                    rows={2}
                  />
                  {space.exchange_preferences && (
                    <textarea
                      placeholder="What you offer in exchange (optional)"
                      value={bookForm.exchange_offer}
                      onChange={(e) => setBookForm((f) => ({ ...f, exchange_offer: e.target.value }))}
                      className={`${theme.inputClass} resize-y`}
                      rows={2}
                    />
                  )}
                  <label className="flex gap-2 text-sm text-dark">
                    <input
                      type="checkbox"
                      checked={bookForm.accepted_terms}
                      onChange={(e) => setBookForm((f) => ({ ...f, accepted_terms: e.target.checked }))}
                      className={`${theme.checkboxAccent} mt-1`}
                    />
                    I accept the terms and conditions
                  </label>
                  <label className="flex gap-2 text-sm text-dark">
                    <input
                      type="checkbox"
                      checked={bookForm.accepted_safety}
                      onChange={(e) => setBookForm((f) => ({ ...f, accepted_safety: e.target.checked }))}
                      className={`${theme.checkboxAccent} mt-1`}
                    />
                    I accept the safety agreements
                  </label>
                  <label className="flex gap-2 text-sm text-dark">
                    <input
                      type="checkbox"
                      checked={bookForm.accepted_privacy}
                      onChange={(e) => setBookForm((f) => ({ ...f, accepted_privacy: e.target.checked }))}
                      className={`${theme.checkboxAccent} mt-1`}
                    />
                    I accept the privacy policy
                  </label>
                  {bookError && <p className="error-text">{bookError}</p>}
                  <button type="submit" disabled={submitting} className={`${theme.primaryBtn} disabled:opacity-50`}>
                    {submitting ? 'Sending...' : 'Send booking request'}
                  </button>
                </form>
              </div>
            )}
          </>
        ) : null}
      </div>
    </AppShell>
  )
}

export default function SpaceDetailPage() {
  return (
    <ProtectedRoute>
      <SpaceDetailContent />
    </ProtectedRoute>
  )
}
