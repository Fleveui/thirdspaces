/**
 * Home hub — choose Find or Host mode after login.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { useAuth } from '@/lib/auth'

function HubContent() {
  const { user } = useAuth()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const [pendingHostCount, setPendingHostCount] = useState(0)
  const [pendingFindCount, setPendingFindCount] = useState(0)

  useEffect(() => {
    if (!token) return

    const loadCounts = async () => {
      try {
        const [hostRes, findRes] = await Promise.all([
          fetch(`${apiUrl}/api/bookings/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/api/bookings/my-requests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
        if (hostRes.ok) {
          const data = await hostRes.json()
          setPendingHostCount(data.filter((b: { status: string }) => b.status === 'pending').length)
        }
        if (findRes.ok) {
          const data = await findRes.json()
          setPendingFindCount(data.filter((b: { status: string }) => b.status === 'pending').length)
        }
      } catch {
        // Badge counts are optional
      }
    }

    loadCounts()
  }, [apiUrl, token])

  return (
    <AppShell mode="hub" showModeNav={false}>
      <div className="max-w-lg mx-auto text-center mb-10">
        <h1 className="text-2xl font-bold text-dark mb-2">
          Welcome back{user?.username ? `, ${user.username}` : ''}!
        </h1>
        <p className="text-gray-600 text-sm">What would you like to do today?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        <Link
          href="/find"
          className="card hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/30 text-left block"
        >
          <h2 className="text-xl font-bold text-primary mb-2">Find a space</h2>
          <p className="text-gray-600 text-sm mb-4">
            Browse and book community spaces near you.
          </p>
          {pendingFindCount > 0 && (
            <span className="inline-block text-xs bg-primary-light text-primary px-3 py-1 rounded-full">
              {pendingFindCount} pending request{pendingFindCount !== 1 ? 's' : ''}
            </span>
          )}
        </Link>

        <Link
          href="/host"
          className="card hover:shadow-md transition-shadow border-2 border-transparent hover:border-primary/30 text-left block"
        >
          <h2 className="text-xl font-bold text-primary mb-2">My spaces</h2>
          <p className="text-gray-600 text-sm mb-4">
            List your space and manage incoming requests.
          </p>
          {pendingHostCount > 0 && (
            <span className="inline-block text-xs bg-primary-light text-primary px-3 py-1 rounded-full">
              {pendingHostCount} request{pendingHostCount !== 1 ? 's' : ''} to review
            </span>
          )}
        </Link>
      </div>

      <div className="max-w-3xl mx-auto mt-10 text-center">
        <Link href="/messages" className="text-primary text-sm hover:underline">
          Messages
        </Link>
      </div>
    </AppShell>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <HubContent />
    </ProtectedRoute>
  )
}
