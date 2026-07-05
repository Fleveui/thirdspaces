/**
 * Saved favorites — borrower view.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { SpaceCard } from '@/components/SpaceCard'
import { SpaceListing } from '@/lib/spaces'
import { useAuth } from '@/lib/auth'
import { fetchFavorites, removeFavorite } from '@/lib/favorites'

function FindFavoritesContent() {
  const router = useRouter()
  const { authFetch } = useAuth()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  const [spaces, setSpaces] = useState<SpaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadFavorites = useCallback(async () => {
    try {
      setSpaces(await fetchFavorites(authFetch, apiUrl))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [apiUrl, authFetch])

  useEffect(() => {
    loadFavorites()
  }, [loadFavorites])

  const handleRemoveFavorite = async (spaceId: string) => {
    try {
      await removeFavorite(authFetch, apiUrl, spaceId)
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  return (
    <AppShell mode="find" variant="minimal">
      <div className="max-w-xl mx-auto">
        <PageHeader title="Saved favorites" onBack={() => router.push('/dashboard')} />

        <section className="rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-5 mb-6">
          <h2 className="font-semibold text-white mb-4">Saved favorites</h2>
          {loading ? (
            <p className="text-white/80 text-sm">Loading your favorites...</p>
          ) : error ? (
            <p className="text-red-100 text-sm">{error}</p>
          ) : spaces.length === 0 ? (
            <p className="text-white/80 text-sm">
              No favorites yet.{' '}
              <Link href="/find" className="text-white underline hover:no-underline">
                Browse spaces to save some.
              </Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {spaces.map((space) => (
                <li key={space.id}>
                  <SpaceCard
                    space={space}
                    apiUrl={apiUrl}
                    layout="row"
                    accent="find"
                    isFavorite
                    onToggleFavorite={() => handleRemoveFavorite(space.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  )
}

export default function FindFavoritesPage() {
  return (
    <ProtectedRoute>
      <FindFavoritesContent />
    </ProtectedRoute>
  )
}
