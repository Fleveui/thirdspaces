'use client'

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
              active
                ? variant === 'host'
                  ? 'bg-host-cream text-dark border-host-cream'
                  : 'bg-primary text-white border-primary'
                : variant === 'host'
                  ? 'bg-host-cream-light/60 text-dark border-transparent hover:border-host-cream/30'
                  : 'bg-primary-light/60 text-dark border-transparent hover:border-primary/30'
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
