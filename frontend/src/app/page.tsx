/**
 * Landing Page
 * Splash screen with login form and join us action
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { LogoMark } from '@/components/LogoMark'
import { PasswordInput } from '@/components/PasswordInput'

export default function Home() {
  const router = useRouter()
  const { user, loading, login, error: authError } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    setSubmitting(true)
    try {
      await login(username, password)
      router.push('/dashboard')
    } catch {
      setError("Looks like you're new here. Let's create your account!")
    } finally {
      setSubmitting(false)
    }
  }

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm flex flex-col items-center">
        <LogoMark size={140} variant="badge" className="mb-8" />
        <h1 className="text-3xl font-bold text-primary text-center mb-10">Match for Space</h1>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            disabled={submitting}
          />

          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="Password"
            disabled={submitting}
          />

          <div className="text-center">
            <a href="#" className="text-primary text-sm hover:underline">
              Forgot your password?
            </a>
          </div>

          {(error || authError) && (
            <div className="error-text bg-red-50 p-3 rounded-2xl border border-red-200">
              {error || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full lowercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'logging in...' : 'login'}
          </button>
        </form>

        <Link
          href="/register"
          className="btn-outline w-full block text-center lowercase mt-6"
        >
          join us!
        </Link>
      </div>
    </div>
  )
}
