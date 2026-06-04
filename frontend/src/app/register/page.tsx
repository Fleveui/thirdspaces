/**
 * Registration Page
 * → see app-requirements.md #1 (Authentication)
 * → see DECISIONS.md #3 (Account Types)
 * → see DECISIONS.md #7 (Error Handling)
 * 
 * Allows users to create a new account
 * Requires: username, email, password, account type selection
 * On success: logs in and redirects to dashboard
 * On error: shows field-level validation errors
 * 
 * Account types:
 *   - user: looking for spaces
 *   - space_owner: offering spaces
 * 
 * Styling: Tailwind CSS with gradient background and card design
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

type AccountType = 'user' | 'space_owner'

export default function RegisterPage() {
  const router = useRouter()
  const { register, loading, error: authError } = useAuth()

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'user' as AccountType,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters'
    }

    if (!formData.email.includes('@')) {
      newErrors.email = 'Please enter a valid email'
    }

    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await register(formData.username, formData.email, formData.password, formData.accountType)
      // Registration and login successful, redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      // Error is displayed below form (from authError)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-dark mb-2">Join Our Community</h1>
          <p className="text-gray-600">Share spaces, discover opportunities</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Type Selection */}
          <div>
            <label htmlFor="accountType" className="block text-sm font-medium text-dark mb-1">
              I want to
            </label>
            <select
              id="accountType"
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              className="input"
              disabled={loading}
            >
              <option value="user">Look for spaces</option>
              <option value="space_owner">Share my spaces</option>
            </select>
          </div>

          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-dark mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="choose_a_username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              disabled={loading}
            />
            {errors.username && <p className="error-text">{errors.username}</p>}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-dark mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              className="input"
              disabled={loading}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-dark mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="••••••"
              value={formData.password}
              onChange={handleChange}
              className="input"
              disabled={loading}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-dark mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              placeholder="••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input"
              disabled={loading}
            />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
          </div>

          {/* Server Error Message */}
          {authError && (
            <div className="error-text bg-red-50 p-3 rounded-lg border border-red-200">
              {authError}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
