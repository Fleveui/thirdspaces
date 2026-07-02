/**
 * List a Space Page — any logged-in user can create a listing.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'

const SPACE_CATEGORIES = ['Loft', 'Terrazza', 'Studio', 'Orto', 'Ufficio'] as const

interface FormData {
  name: string
  location: string
  area_m2: string
  category: string
  is_outdoor: string
  availability: string
  description: string
  rules: string
  deposit_needed: string
  exchange_preferences: string
}

const initialFormData: FormData = {
  name: '',
  location: '',
  area_m2: '',
  category: '',
  is_outdoor: 'false',
  availability: '',
  description: '',
  rules: '',
  deposit_needed: '',
  exchange_preferences: '',
}

function ListSpaceContent() {
  const router = useRouter()

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required'
    }

    const area = parseFloat(formData.area_m2)
    if (!formData.area_m2 || isNaN(area) || area <= 0) {
      newErrors.area_m2 = 'Area must be greater than 0'
    }

    if (!formData.category) {
      newErrors.category = 'Space type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
    if (submitError) {
      setSubmitError(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      setSubmitError('You must be logged in to list a space')
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

    const body: Record<string, unknown> = {
      name: formData.name.trim(),
      location: formData.location.trim(),
      area_m2: parseFloat(formData.area_m2),
      category: formData.category,
      is_outdoor: formData.is_outdoor === 'true',
    }

    if (formData.availability.trim()) {
      body.availability = formData.availability.trim()
    }
    if (formData.description.trim()) {
      body.description = formData.description.trim()
    }
    if (formData.rules.trim()) {
      body.rules = formData.rules.trim()
    }
    if (formData.exchange_preferences.trim()) {
      body.exchange_preferences = formData.exchange_preferences.trim()
    }
    if (formData.deposit_needed.trim()) {
      const deposit = parseFloat(formData.deposit_needed)
      if (!isNaN(deposit) && deposit >= 0) {
        body.deposit_needed = deposit
      }
    }

    try {
      const response = await fetch(`${apiUrl}/api/spaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (typeof data?.detail === 'string') {
          setSubmitError(data.detail)
        } else if (Array.isArray(data?.detail)) {
          setSubmitError(data.detail.map((item: { msg?: string }) => item.msg).join(', '))
        } else {
          setSubmitError('Failed to create space')
        }
        return
      }

      const created = await response.json()
      const spaceId = created.id

      if (photos && photos.length > 0) {
        for (let i = 0; i < Math.min(photos.length, 3); i++) {
          const fd = new FormData()
          fd.append('file', photos[i])
          await fetch(`${apiUrl}/api/spaces/${spaceId}/photos`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          })
        }
      }

      router.push('/host')
    } catch {
      setSubmitError('Failed to create space. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell mode="host">
      <div className="max-w-lg mx-auto">
        <div className="card w-full">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">List a Space</h1>
          <p className="text-gray-600">Share your space with the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-dark mb-1">
              Listing title
            </label>
            <input
              id="name"
              type="text"
              name="name"
              placeholder="e.g. Sunny Loft in Navigli"
              value={formData.name}
              onChange={handleChange}
              className="input"
              disabled={submitting}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-dark mb-1">
              Location
            </label>
            <input
              id="location"
              type="text"
              name="location"
              placeholder="e.g. Via Naviglio Grande, Milano"
              value={formData.location}
              onChange={handleChange}
              className="input"
              disabled={submitting}
            />
            {errors.location && <p className="error-text">{errors.location}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="area_m2" className="block text-sm font-medium text-dark mb-1">
                Area (m²)
              </label>
              <input
                id="area_m2"
                type="number"
                name="area_m2"
                min="0"
                step="0.1"
                placeholder="120"
                value={formData.area_m2}
                onChange={handleChange}
                className="input"
                disabled={submitting}
              />
              {errors.area_m2 && <p className="error-text">{errors.area_m2}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-dark mb-1">
                Space type
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="input"
                disabled={submitting}
              >
                <option value="">Select type</option>
                {SPACE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className="error-text">{errors.category}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="is_outdoor" className="block text-sm font-medium text-dark mb-1">
              Indoor / Outdoor
            </label>
            <select
              id="is_outdoor"
              name="is_outdoor"
              value={formData.is_outdoor}
              onChange={handleChange}
              className="input"
              disabled={submitting}
            >
              <option value="false">Indoor</option>
              <option value="true">Outdoor</option>
            </select>
          </div>

          <div>
            <label htmlFor="availability" className="block text-sm font-medium text-dark mb-1">
              Availability
            </label>
            <input
              id="availability"
              type="text"
              name="availability"
              placeholder="e.g. Weekends, Flexible, Daily"
              value={formData.availability}
              onChange={handleChange}
              className="input"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-dark mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="Tell people what makes your space special..."
              value={formData.description}
              onChange={handleChange}
              className="input resize-y"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="rules" className="block text-sm font-medium text-dark mb-1">
              Rules
            </label>
            <textarea
              id="rules"
              name="rules"
              rows={3}
              placeholder="Any guidelines for using the space..."
              value={formData.rules}
              onChange={handleChange}
              className="input resize-y"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="exchange_preferences" className="block text-sm font-medium text-dark mb-1">
              Exchange preferences
            </label>
            <textarea
              id="exchange_preferences"
              name="exchange_preferences"
              rows={2}
              placeholder="What would you accept in exchange? (optional)"
              value={formData.exchange_preferences}
              onChange={handleChange}
              className="input resize-y"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="deposit_needed" className="block text-sm font-medium text-dark mb-1">
              Deposit needed (€)
            </label>
            <input
              id="deposit_needed"
              type="number"
              name="deposit_needed"
              min="0"
              step="1"
              placeholder="Optional"
              value={formData.deposit_needed}
              onChange={handleChange}
              className="input"
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="photos" className="block text-sm font-medium text-dark mb-1">
              Photos (up to 3)
            </label>
            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(e.target.files)}
              className="input"
              disabled={submitting}
            />
          </div>

          {submitError && (
            <div className="error-text bg-red-50 p-3 rounded-lg border border-red-200">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creating listing...' : 'Create Listing'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <Link href="/host" className="font-medium text-primary hover:underline">
            Back to My spaces
          </Link>
        </div>
      </div>
      </div>
    </AppShell>
  )
}

export default function ListSpacePage() {
  return (
    <ProtectedRoute>
      <ListSpaceContent />
    </ProtectedRoute>
  )
}
