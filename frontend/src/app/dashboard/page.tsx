/**
 * Home hub — choose Find or Host mode after login.
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import {
  HubActionCard,
  IncomingRequestsStrip,
  MyBookingRequestsStrip,
  SavedFavoritesStrip,
} from '@/components/HubActionCard'
import { fetchConversations } from '@/lib/chat'
import { LogoMark } from '@/components/LogoMark'
import { useAuth } from '@/lib/auth'

function displayName(username: string | undefined): string {
  if (!username) return 'there'
  return username.charAt(0).toUpperCase() + username.slice(1)
}

function HubContent() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null

  const [pendingHostCount, setPendingHostCount] = useState(0)
  const [pendingFindCount, setPendingFindCount] = useState(0)
  const [favoritesCount, setFavoritesCount] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)

  useEffect(() => {
    if (!token) return

    const loadCounts = async () => {
      try {
        const [hostRes, findRes, favRes, chatRes] = await Promise.all([
          fetch(`${apiUrl}/api/bookings/mine`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/api/bookings/my-requests`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiUrl}/api/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetchConversations(token, apiUrl).then((data) => ({ ok: true, data })).catch(() => ({ ok: false })),
        ])

        if (hostRes.ok) {
          const data = await hostRes.json()
          setPendingHostCount(data.filter((b: { status: string }) => b.status === 'pending').length)
        }

        if (findRes.ok) {
          const data = await findRes.json()
          setPendingFindCount(data.filter((b: { status: string }) => b.status === 'pending').length)
        }

        if (favRes.ok) {
          const data = await favRes.json()
          setFavoritesCount(data.length)
        }

        if (chatRes.ok && 'data' in chatRes) {
          setMessagesCount(chatRes.data.length)
        }
      } catch {
        // Badge counts are optional
      }
    }

    loadCounts()
  }, [apiUrl, token])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <LogoMark size={44} variant="badge" className="shrink-0" />
            <h1 className="text-2xl font-bold text-primary truncate">
              {displayName(user?.username)}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/messages"
              className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              aria-label="Messages"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              {messagesCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
              )}
            </Link>
            <Link
              href="/host/requests"
              className="relative w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              aria-label="Incoming requests"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {pendingHostCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-white" />
              )}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              aria-label="Log out"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </header>

        <div className="space-y-4">
          <HubActionCard variant="find" href="/find" />
          <MyBookingRequestsStrip href="/find/requests" count={pendingFindCount} />
          <SavedFavoritesStrip href="/find/favorites" count={favoritesCount} />
          <HubActionCard variant="host" href="/host" />
          <IncomingRequestsStrip href="/host/requests" count={pendingHostCount} />
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <HubContent />
    </ProtectedRoute>
  )
}
