'use client'

import { SparkleIcon } from '@/components/SparkleIcon'
import { AccentMode } from '@/lib/theme'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: number
  accent?: AccentMode
  /** Compact single-sparkle + number for listing cards */
  compact?: boolean
  ratingCount?: number
}

function filledClass(accent: AccentMode): string {
  return accent === 'host' ? 'text-host-cream-accent' : 'text-primary'
}

export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = 24,
  accent = 'find',
  compact = false,
  ratingCount,
}: StarRatingProps) {
  const filled = filledClass(accent)
  const empty = 'text-gray-300'

  if (compact) {
    const label =
      ratingCount != null && ratingCount > 0
        ? `${value} out of 5 stars, ${ratingCount} review${ratingCount === 1 ? '' : 's'}`
        : `${value} out of 5 stars`
    return (
      <span className="inline-flex items-center gap-1 text-sm font-medium text-dark" role="img" aria-label={label}>
        <SparkleIcon size={size} className={filled} />
        <span>{value.toFixed(1)}</span>
        {ratingCount != null && ratingCount > 0 && (
          <span className="text-gray-500 font-normal">({ratingCount})</span>
        )}
      </span>
    )
  }

  const stars = [1, 2, 3, 4, 5]

  if (readOnly) {
    return (
      <div className="flex gap-1" role="img" aria-label={`${value} out of 5 stars`}>
        {stars.map((star) => (
          <SparkleIcon
            key={star}
            size={size}
            className={star <= value ? filled : empty}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={`${value} out of 5 stars`}>
      {stars.map((star) => {
        const isFilled = star <= value
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className={`transition-opacity ${isFilled ? filled : empty} hover:opacity-80`}
            aria-label={`${star} star${star === 1 ? '' : 's'}`}
          >
            <SparkleIcon size={size} className="block" />
          </button>
        )
      })}
    </div>
  )
}
