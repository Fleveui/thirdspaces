/**
 * Space Detail Page with photo gallery and Book Now form.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { SpaceListing, resolveImageUrl, outdoorLabel } from '@/lib/spaces'

function displayText(value: string | null, fallback: string): string {
  return value?.trim() ? value : fallback
}

function SpaceDetailContent() {
  const params = useParams()
  const id = params.id as string
  const { user } = useAuth()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const [space, setSpace] = useState<SpaceListing | null>(null)
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

  const isOwnSpace = user && space && user.id === space.owner_id
  const shellMode = isOwnSpace ? 'host' : 'find'
  const backHref = isOwnSpace ? '/host' : '/find'
  const backLabel = isOwnSpace ? 'Back to My spaces' : 'Back to search'

  return (
    <AppShell mode={shellMode}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={backHref} className="font-medium text-primary hover:underline">
            {backLabel}
          </Link>
        </div>

        {loading ? (
          <div className="card"><p className="text-gray-600 text-sm">Loading space details...</p></div>
        ) : notFound ? (
          <div className="card">
            <h1 className="text-2xl font-bold text-dark mb-2">Space not found</h1>
          </div>
        ) : error ? (
          <div className="card"><p className="text-red-600 text-sm">{error}</p></div>
        ) : space ? (
          <>
            {photos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-6">
                {photos.map((photo) => {
                  const src = resolveImageUrl(photo.image_url, apiUrl)
                  return (
                    <div key={photo.photo_id} className="h-36 bg-primary-light rounded-2xl overflow-hidden">
                      {src && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={src} alt={space.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div className="card mb-6">
              <h1 className="text-2xl font-bold text-dark mb-2">{space.name}</h1>
              <p className="text-sm text-gray-600 mb-4">
                {displayText(space.location, 'No location set')} · {outdoorLabel(space.is_outdoor)}
                {space.area_m2 ? ` · ${space.area_m2} m²` : ''}
              </p>

              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-medium text-gray-600 mb-1">Availability</h2>
                  <p className="text-dark">{displayText(space.availability, 'Contact owner')}</p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-600 mb-1">Description</h2>
                  <p className="text-dark whitespace-pre-wrap">
                    {displayText(space.description, 'No description provided')}
                  </p>
                </div>
                <div>
                  <h2 className="text-sm font-medium text-gray-600 mb-1">Rules</h2>
                  <p className="text-dark whitespace-pre-wrap">
                    {displayText(space.rules, 'No rules provided')}
                  </p>
                </div>
                {space.exchange_preferences && (
                  <div>
                    <h2 className="text-sm font-medium text-gray-600 mb-1">Exchange preferences</h2>
                    <p className="text-dark whitespace-pre-wrap">{space.exchange_preferences}</p>
                  </div>
                )}
              </div>

              {user && user.id !== space.owner_id && !bookSuccess && (
                <button
                  type="button"
                  onClick={() => setShowBookForm((v) => !v)}
                  className="btn-primary mt-8 w-full"
                >
                  Book Now
                </button>
              )}

              {bookSuccess && (
                <div className="mt-8 p-4 bg-primary-light rounded-2xl">
                  <p className="font-medium text-primary">Pending Approval</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Your booking request was sent. Track it on{' '}
                    <Link href="/find" className="text-primary hover:underline">Find a space</Link>.
                  </p>
                </div>
              )}
            </div>

            {showBookForm && (
              <div className="card">
                <h2 className="text-lg font-semibold text-dark mb-4">Booking request</h2>
                <form onSubmit={handleBookSubmit} className="space-y-4">
                  <input
                    type="date"
                    required
                    value={bookForm.start_date}
                    onChange={(e) => setBookForm((f) => ({ ...f, start_date: e.target.value }))}
                    className="input"
                  />
                  <input
                    type="date"
                    required
                    value={bookForm.end_date}
                    onChange={(e) => setBookForm((f) => ({ ...f, end_date: e.target.value }))}
                    className="input"
                  />
                  <textarea
                    required
                    placeholder="Intended use"
                    value={bookForm.intended_use}
                    onChange={(e) => setBookForm((f) => ({ ...f, intended_use: e.target.value }))}
                    className="input resize-y"
                    rows={2}
                  />
                  {space.exchange_preferences && (
                    <textarea
                      placeholder="What you offer in exchange (optional)"
                      value={bookForm.exchange_offer}
                      onChange={(e) => setBookForm((f) => ({ ...f, exchange_offer: e.target.value }))}
                      className="input resize-y"
                      rows={2}
                    />
                  )}
                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={bookForm.accepted_terms}
                      onChange={(e) => setBookForm((f) => ({ ...f, accepted_terms: e.target.checked }))}
                      className="accent-primary mt-1"
                    />
                    I accept the terms and conditions
                  </label>
                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={bookForm.accepted_safety}
                      onChange={(e) => setBookForm((f) => ({ ...f, accepted_safety: e.target.checked }))}
                      className="accent-primary mt-1"
                    />
                    I accept the safety agreements
                  </label>
                  <label className="flex gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={bookForm.accepted_privacy}
                      onChange={(e) => setBookForm((f) => ({ ...f, accepted_privacy: e.target.checked }))}
                      className="accent-primary mt-1"
                    />
                    I accept the privacy policy
                  </label>
                  {bookError && <p className="error-text">{bookError}</p>}
                  <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-50">
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
