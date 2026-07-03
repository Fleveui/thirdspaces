/**
 * Registration Page
 * → see app-requirements.md #1 (Authentication)
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { PasswordInput } from '@/components/PasswordInput'
import { SparkleIcon } from '@/components/SparkleIcon'

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

  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})

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

    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions'
    }

    if (!acceptedPrivacy) {
      newErrors.privacy = 'You must accept the privacy policy'
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
      router.push('/register/verified')
    } catch {
      // Error displayed via authError
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-6">
      <div className="flex items-center justify-between mb-8">
        <Link href="/" className="text-primary text-2xl font-light" aria-label="Back to home">
          &lsaquo;
        </Link>
      </div>

      <div className="flex-1 w-full max-w-sm mx-auto pb-8">
        <div className="text-center mb-8">
          <SparkleIcon size={64} className="text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary">Nice to meet you!</h1>
          <p className="text-gray-600 text-sm mt-2">Create your Match for Space account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <input
              id="username"
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="input"
              disabled={loading}
            />
            {errors.username && <p className="error-text">{errors.username}</p>}
          </div>

          <div>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              disabled={loading}
            />
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>

          <div>
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, password: value }))
                if (errors.password) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.password
                    return next
                  })
                }
              }}
              placeholder="Password"
              disabled={loading}
            />
            {errors.password && <p className="error-text">{errors.password}</p>}
          </div>

          <div>
            <PasswordInput
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(value) => {
                setFormData((prev) => ({ ...prev, confirmPassword: value }))
                if (errors.confirmPassword) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.confirmPassword
                    return next
                  })
                }
              }}
              placeholder="Confirm password"
              disabled={loading}
            />
            {errors.confirmPassword && <p className="error-text">{errors.confirmPassword}</p>}
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => {
                setAcceptedTerms(e.target.checked)
                if (errors.terms) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.terms
                    return next
                  })
                }
              }}
              className="mt-1 accent-primary"
              disabled={loading}
            />
            <span>I accept the terms and conditions</span>
          </label>
          {errors.terms && <p className="error-text">{errors.terms}</p>}

          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedPrivacy}
              onChange={(e) => {
                setAcceptedPrivacy(e.target.checked)
                if (errors.privacy) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.privacy
                    return next
                  })
                }
              }}
              className="mt-1 accent-primary"
              disabled={loading}
            />
            <span>I accept the privacy policy</span>
          </label>
          {errors.privacy && <p className="error-text">{errors.privacy}</p>}

          {authError && (
            <div className="error-text bg-red-50 p-3 rounded-2xl border border-red-200">
              {authError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full lowercase disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'creating account...' : 'join us!'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/" className="font-medium text-primary hover:underline">
            login
          </Link>
        </div>
      </div>
    </div>
  )
}
