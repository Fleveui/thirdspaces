/**
 * Space Detail Page
 * → see app-requirements.md #3 (Space Details)
 *
 * Public page showing minimal listing info via GET /api/spaces/{id}.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Space {
  id: string
  name: string
  location: string | null
  description: string | null
  rules: string | null
}

function displayText(value: string | null, fallback: string): string {
  return value?.trim() ? value : fallback
}

export default function SpaceDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [space, setSpace] = useState<Space | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/api/spaces/${id}`)

        if (response.status === 404) {
          setNotFound(true)
          return
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || 'Failed to load space details')
        }

        const data = await response.json()
        setSpace(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSpace()
  }, [id])

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/dashboard" className="font-medium text-primary hover:underline">
            Back to dashboard
          </Link>
        </div>

        {loading ? (
          <div className="card">
            <p className="text-gray-600 text-sm">Loading space details...</p>
          </div>
        ) : notFound ? (
          <div className="card">
            <h1 className="text-2xl font-bold text-dark mb-2">Space not found</h1>
            <p className="text-gray-600 text-sm">
              This listing may have been removed or the link is incorrect.
            </p>
          </div>
        ) : error ? (
          <div className="card">
            <h1 className="text-2xl font-bold text-dark mb-2">Something went wrong</h1>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        ) : space ? (
          <div className="card">
            <h1 className="text-2xl font-bold text-dark mb-6">{space.name}</h1>

            <div className="space-y-5">
              <div>
                <h2 className="text-sm font-medium text-gray-600 mb-1">Location</h2>
                <p className="text-dark">
                  {displayText(space.location, 'No location set')}
                </p>
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
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
