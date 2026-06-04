/**
 * Login Page
 * → see app-requirements.md #1 (Authentication)
 * → see DECISIONS.md #7 (Error Handling)
 * 
 * Allows users to log in with username and password
 * On success: redirects to dashboard
 * On invalid credentials: shows error message
 * New users: prompts to create account (via registration page)
 * 
 * Components: form with username/password inputs, submit button, error display
 * Styling: Tailwind CSS with custom .input and .btn classes
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

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
      // Login successful, redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      // Invalid credentials: prompt to create account
      setError("Looks like you're new here. Let's create your account!")
      // Note: user can click "Don't have an account?" to go to registration
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-dark mb-2">Welcome Back</h1>
          <p className="text-gray-600">Share spaces, build community</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-dark mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-dark mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              disabled={loading}
            />
          </div>

          {/* Error Message */}
          {(error || authError) && (
            <div className="error-text bg-red-50 p-3 rounded-lg border border-red-200">
              {error || authError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  )
}
