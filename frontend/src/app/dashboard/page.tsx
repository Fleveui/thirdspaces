/**
 * Dashboard Page
 * → see app-requirements.md #7 & #8 (User Dashboard & Owner Dashboard)
 * → see DECISIONS.md #8 (Dashboard Redirect)
 * 
 * Shows different content based on account_type:
 *   - user: upcoming bookings, pending requests, saved spaces, messages
 *   - space_owner: their spaces, booking requests, availability, messages
 * 
 * For now: placeholder showing user info and account type
 * Next phase: implement space-specific dashboards
 * 
 * Protected: requires authentication (uses ProtectedRoute wrapper)
 */

'use client'

import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'

interface SpaceListing {
  id: string
  name: string
  location: string | null
}

function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<SpaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const isSpaceOwner = user?.account_type === 'space_owner'

  useEffect(() => {
    if (!isSpaceOwner) {
      setLoading(false)
      return
    }

    const fetchListings = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`${apiUrl}/api/spaces/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data.detail || 'Failed to fetch your listings')
        }
        const data = await response.json()
        setListings(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [isSpaceOwner])

  return (
    <div className="min-h-screen bg-light">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-dark">
              {isSpaceOwner ? 'Space Owner Dashboard' : 'User Dashboard'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {isSpaceOwner ? 'Manage your spaces and booking requests' : 'Discover and book spaces'}
            </p>
          </div>
          <div className="flex gap-3">
            {isSpaceOwner && (
              <Link href="/spaces/new" className="btn-primary">
                List a Space
              </Link>
            )}
            <button onClick={handleLogout} className="btn-secondary">
              Log Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <div className="card mb-8 max-w-md">
          <h2 className="text-lg font-semibold text-dark mb-4">You're successfully logged in!</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Username</p>
              <p className="font-medium text-dark">{user?.username}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-dark">{user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Type</p>
              <p className="font-medium text-dark capitalize">
                {isSpaceOwner ? 'Space Owner' : 'User'}
              </p>
            </div>
          </div>
        </div>

        {/* Placeholder Section for Future Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {isSpaceOwner ? (
            <>
              <div className="card md:col-span-2">
                <h3 className="font-semibold text-dark mb-4">Your Listings</h3>
                {loading ? (
                  <p className="text-gray-600 text-sm">Loading your listings...</p>
                ) : error ? (
                  <p className="text-red-600 text-sm">{error}</p>
                ) : listings.length === 0 ? (
                  <p className="text-gray-600 text-sm">
                    You have not listed any spaces yet.{' '}
                    <Link href="/spaces/new" className="text-primary hover:underline">
                      List a Space
                    </Link>
                  </p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {listings.map((listing) => (
                      <li key={listing.id} className="py-3 first:pt-0 last:pb-0">
                        <p className="font-medium text-dark">{listing.name}</p>
                        <p className="text-sm text-gray-600">{listing.location || 'No location set'}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Booking Requests</h3>
                <p className="text-gray-600 text-sm">Coming soon: review and approve requests</p>
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Availability Calendar</h3>
                <p className="text-gray-600 text-sm">Coming soon: manage space availability</p>
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Messages</h3>
                <p className="text-gray-600 text-sm">Coming soon: chat with users</p>
              </div>
            </>
          ) : (
            <>
              {/* User Dashboard Sections */}
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Upcoming Bookings</h3>
                <p className="text-gray-600 text-sm">Coming soon: view your confirmed bookings</p>
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Pending Requests</h3>
                <p className="text-gray-600 text-sm">Coming soon: track requests awaiting approval</p>
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Saved Spaces</h3>
                <p className="text-gray-600 text-sm">Coming soon: your favorite spaces</p>
              </div>
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Messages</h3>
                <p className="text-gray-600 text-sm">Coming soon: chat with space owners</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
