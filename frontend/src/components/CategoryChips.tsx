'use client'

import { accentClasses } from '@/lib/theme'

interface CategoryChipsProps {
  categories: readonly string[]
  selected: string
  onSelect: (category: string) => void
  variant?: 'find' | 'host'
}

export function CategoryChips({
  categories,
  selected,
  onSelect,
  variant = 'find',
}: CategoryChipsProps) {
  const theme = accentClasses(variant)

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const active = selected === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(active ? '' : cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
              active ? theme.chipActive : theme.chipInactive
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
