/**
 * Post-registration verification screen (simplified — no real email).
 */

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SparkleIcon } from '@/components/SparkleIcon'

export default function RegisterVerifiedPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 4000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <SparkleIcon size={64} className="text-primary mb-6" />
      <h1 className="text-2xl font-bold text-primary text-center mb-3">
        Account created — you&apos;re verified!
      </h1>
      <p className="text-gray-600 text-center text-sm max-w-sm mb-8">
        Welcome to Match for Space. Choose <strong>Find a space</strong> or <strong>My spaces</strong> from your home hub.
      </p>
      <Link href="/dashboard" className="btn-primary lowercase">
        go to dashboard
      </Link>
      <p className="text-gray-400 text-xs mt-4">Redirecting automatically...</p>
    </div>
  )
}
