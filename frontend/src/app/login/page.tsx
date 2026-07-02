/**
 * Login Page
 * → see app-requirements.md #1 (Authentication)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { PasswordInput, SparkleIcon } from '@/components/PasswordInput'

export default function LoginPage() {
  const router = useRouter()
  const { login, loading, error: authError } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please fill in all fields')
      return
    }

    try {
      await login(username, password)
      router.push('/dashboard')
    } catch {
      setError("Looks like you're new here. Let's create your account!")
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-6">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-primary text-2xl font-light" aria-label="Back to home">
          &lsaquo;
        </Link>
        <span className="text-primary" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center w-full max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-primary text-center mb-6">Wow you&apos;re back!</h1>
        <SparkleIcon className="mb-10" />

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            id="username"
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input"
            disabled={loading}
          />

          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            placeholder="Password"
            disabled={loading}
          />

          <div className="text-center pt-2">
            <a href="#" className="text-primary text-sm hover:underline">
              Forgot password?
            </a>
          </div>

          {(error || authError) && (
            <div className="error-text bg-red-50 p-3 rounded-2xl border border-red-200">
              {error || authError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full lowercase mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'logging in...' : 'login'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            join us!
          </Link>
        </div>
      </div>
    </div>
  )
}
