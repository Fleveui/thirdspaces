/**
 * List a Space Page — any logged-in user can create a listing.
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppShell } from '@/components/AppShell'
import { PageHeader } from '@/components/PageHeader'
import { CategoryChips } from '@/components/CategoryChips'
import { SPACE_CATEGORIES, EXCHANGE_OPTIONS } from '@/lib/spaces'
import { accentClasses } from '@/lib/theme'

interface FormData {
  name: string
  location: string
  area_m2: string
  max_people: string
  category: string
  is_outdoor: string
  availability: string
  description: string
}

const initialFormData: FormData = {
  name: '',
  location: '',
  area_m2: '',
  max_people: '',
  category: '',
  is_outdoor: 'false',
  availability: '',
  description: '',
}

function ListSpaceContent() {
  const router = useRouter()
  const host = accentClasses('host')

  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [exchangePreferences, setExchangePreferences] = useState('')
  const [photos, setPhotos] = useState<FileList | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.location.trim()) newErrors.location = 'Location is required'

    const area = parseFloat(formData.area_m2)
    if (!formData.area_m2 || isNaN(area) || area <= 0) {
      newErrors.area_m2 = 'Area must be greater than 0'
    }

    if (!formData.category) newErrors.category = 'Category is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
    if (submitError) setSubmitError(null)
  }

  const appendExchangeSuggestion = (option: string) => {
    setExchangePreferences((prev) => {
      const trimmed = prev.trim()
      const parts = trimmed
        ? trimmed.split(';').map((part) => part.trim()).filter(Boolean)
        : []
      if (parts.includes(option)) return prev
      if (!trimmed) return option
      return `${trimmed}; ${option}`
    })
    if (submitError) setSubmitError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

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
      is_outdoor: formData.is_outdoor === 'both' ? null : formData.is_outdoor === 'true',
    }

    if (formData.availability.trim()) body.availability = formData.availability.trim()
    if (formData.description.trim()) body.description = formData.description.trim()
    if (exchangePreferences.trim()) {
      body.exchange_preferences = exchangePreferences.trim()
    }
    if (formData.max_people.trim()) {
      const mp = parseInt(formData.max_people, 10)
      if (!isNaN(mp) && mp > 0) body.max_people = mp
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
    <AppShell mode="host" variant="minimal">
      <div className="max-w-xl mx-auto">
        <PageHeader title="List your space" onBack={() => router.push('/host')} />

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="text"
            placeholder="Name of space"
            value={formData.name}
            onChange={(e) => setField('name', e.target.value)}
            className="input-cream"
            disabled={submitting}
          />
          {errors.name && <p className="error-text">{errors.name}</p>}

          <input
            type="text"
            placeholder="Location (e.g. Via Laurin, Bolzano)"
            value={formData.location}
            onChange={(e) => setField('location', e.target.value)}
            className="input-cream"
            disabled={submitting}
          />
          {errors.location && <p className="error-text">{errors.location}</p>}

          <input
            type="number"
            placeholder="Area (m²)"
            min="0"
            step="0.1"
            value={formData.area_m2}
            onChange={(e) => setField('area_m2', e.target.value)}
            className="input-cream"
            disabled={submitting}
          />
          {errors.area_m2 && <p className="error-text">{errors.area_m2}</p>}

          <div>
            <input
              type="text"
              placeholder="Time/dates available"
              value={formData.availability}
              onChange={(e) => setField('availability', e.target.value)}
              className="input-cream"
              disabled={submitting}
            />
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              e.g. Weekdays July—August, or From 1 Sep
            </p>
          </div>

          <input
            type="number"
            placeholder="Max number of people"
            min="1"
            value={formData.max_people}
            onChange={(e) => setField('max_people', e.target.value)}
            className="input-cream"
            disabled={submitting}
          />

          <div>
            <p className="text-sm font-semibold text-dark mb-3">Category</p>
            <CategoryChips
              categories={SPACE_CATEGORIES}
              selected={formData.category}
              onSelect={(cat) => setField('category', cat)}
              variant="host"
            />
            {errors.category && <p className="error-text mt-1">{errors.category}</p>}
          </div>

          <div>
            <p className="text-sm font-semibold text-dark mb-3">Indoor / Outdoor</p>
            <div className="flex gap-2">
              {[
                { value: 'false', label: 'Indoor' },
                { value: 'true', label: 'Outdoor' },
                { value: 'both', label: 'Both' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setField('is_outdoor', opt.value)}
                  className={`flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-colors ${
                    formData.is_outdoor === opt.value
                      ? host.chipActive
                      : 'border-gray-200 text-gray-600 hover:border-host-cream/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-dark mb-3">Additional info</p>
            <textarea
              rows={4}
              placeholder="Describe your space — facilities, access, any conditions of use..."
              value={formData.description}
              onChange={(e) => setField('description', e.target.value)}
              className="input-cream resize-y"
              disabled={submitting}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-dark mb-3">Exchange preferences</p>
            <textarea
              rows={3}
              placeholder="What would you like in exchange for use of your space? e.g. help with setup, social media promotion..."
              value={exchangePreferences}
              onChange={(e) => {
                setExchangePreferences(e.target.value)
                if (submitError) setSubmitError(null)
              }}
              className="input-cream resize-y"
              disabled={submitting}
            />
            <p className="text-xs text-gray-400 mt-1.5 ml-1">
              Separate multiple items with semicolons, or tap a suggestion below.
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {EXCHANGE_OPTIONS.map((option) => {
                const included = exchangePreferences
                  .split(';')
                  .map((part) => part.trim())
                  .includes(option)
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => appendExchangeSuggestion(option)}
                    disabled={submitting || included}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                      included
                        ? `${host.chipActive} opacity-60 cursor-default`
                        : 'border-gray-200 text-gray-600 hover:border-host-cream/40'
                    }`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="photos" className="block text-sm font-medium text-dark mb-2">
              Photos (up to 3)
            </label>
            <input
              id="photos"
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setPhotos(e.target.files)}
              className="input-cream"
              disabled={submitting}
            />
          </div>

          {submitError && (
            <div className="error-text bg-red-50 p-3 rounded-2xl border border-red-200">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn-host w-full rounded-3xl py-4 disabled:opacity-50"
          >
            {submitting ? 'Creating listing...' : 'Create listing'}
          </button>
        </form>
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
