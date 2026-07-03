'use client'

import { SPACE_CATEGORIES, SpaceFilters, emptyFilters } from '@/lib/spaces'
import { CategoryChips } from '@/components/CategoryChips'

interface FilterPanelProps {
  open: boolean
  filters: SpaceFilters
  onChange: (filters: SpaceFilters) => void
  onClose: () => void
  onApply: () => void
}

export function FilterPanel({ open, filters, onChange, onClose, onApply }: FilterPanelProps) {
  if (!open) return null

  const minArea = filters.min_area ? Number(filters.min_area) : 50
  const minPeople = filters.min_people ? Number(filters.min_people) : 20

  const setField = <K extends keyof SpaceFilters>(key: K, value: SpaceFilters[K]) => {
    onChange({ ...filters, [key]: value })
  }

  const handleClear = () => {
    onChange(emptyFilters())
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close filters"
      />
      <div className="relative bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-dark text-center mb-6">Filters</h2>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold text-dark mb-3">Category</p>
            <CategoryChips
              categories={SPACE_CATEGORIES}
              selected={filters.category}
              onSelect={(cat) => setField('category', cat)}
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-dark mb-3">Indoor / Outdoor</p>
            <div className="flex gap-2">
              {[
                { value: '', label: 'Any' },
                { value: 'false', label: 'Indoor' },
                { value: 'true', label: 'Outdoor' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setField('is_outdoor', opt.value)}
                  className={`flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-colors ${
                    filters.is_outdoor === opt.value
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-200 text-gray-600 hover:border-primary/40'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-dark mb-2">
              Minimum area: <span className="text-primary">{minArea} m²</span>
            </p>
            <input
              type="range"
              min={0}
              max={300}
              step={10}
              value={minArea}
              onChange={(e) => setField('min_area', e.target.value)}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-dark mb-2">
              Max people: <span className="text-primary">{minPeople}</span>
            </p>
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={minPeople}
              onChange={(e) => setField('min_people', e.target.value)}
              className="w-full accent-primary"
            />
          </div>

          <div>
            <p className="text-sm font-semibold text-dark mb-3">Availability</p>
            <div className="space-y-2">
              {[
                { value: '', label: 'Anytime' },
                { value: 'week', label: 'This week' },
                { value: 'month', label: 'This month' },
              ].map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setField('availability', opt.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-left text-sm ${
                    filters.availability === opt.value
                      ? 'border-primary bg-primary-light/40'
                      : 'border-gray-200'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      filters.availability === opt.value ? 'border-primary' : 'border-gray-300'
                    }`}
                  >
                    {filters.availability === opt.value && (
                      <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    )}
                  </span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button type="button" onClick={handleClear} className="btn-secondary flex-1 text-sm">
            Clear all
          </button>
          <button
            type="button"
            onClick={() => {
              onApply()
              onClose()
            }}
            className="btn-primary flex-1 text-sm"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
