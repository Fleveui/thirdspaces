/**
 * Landing Page
 * Splash screen with login and join us actions
 */

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { LogoMark } from '@/components/LogoMark'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between px-6 py-12">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">
        <LogoMark size={140} className="mb-8" />
        <h1 className="text-3xl font-bold text-primary text-center">Match for Space</h1>
      </div>

      <div className="w-full max-w-sm space-y-4 pb-8">
        <Link href="/login" className="btn-primary w-full block text-center lowercase">
          login
        </Link>
        <Link href="/register" className="btn-outline w-full block text-center lowercase">
          join us!
        </Link>
      </div>
    </div>
  )
}
