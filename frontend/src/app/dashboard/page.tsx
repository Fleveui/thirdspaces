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
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useState, useEffect } from 'react'

interface Space {
  id: string
  name: string
  owner_id: string
  area_m2: number
  is_outdoor: boolean
  category: string
  availability: string
  deposit_needed: number
  location: string
}

function DashboardContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Fetch spaces from API
  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/api/spaces`)
        if (!response.ok) {
          throw new Error('Failed to fetch spaces')
        }
        const data = await response.json()
        setSpaces(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchSpaces()
  }, [])

  const isSpaceOwner = user?.account_type === 'space_owner'

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
          <button
            onClick={handleLogout}
            className="btn-secondary"
          >
            Log Out
          </button>
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
              {/* Space Owner Dashboard Sections */}
              <div className="card opacity-50">
                <h3 className="font-semibold text-dark mb-2">Your Spaces</h3>
                <p className="text-gray-600 text-sm">Coming soon: manage your listed spaces</p>
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
