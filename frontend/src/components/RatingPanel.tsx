'use client'

import { StarRating } from '@/components/StarRating'
import { AccentMode, accentClasses } from '@/lib/theme'

interface RatingPanelProps {
  title: string
  accent: AccentMode
  rating: number
  onRatingChange: (value: number) => void
  comment: string
  onCommentChange: (value: string) => void
  onSubmit: () => void
  submitting?: boolean
  submitted?: boolean
  submittedRating?: number | null
}

export function RatingPanel({
  title,
  accent,
  rating,
  onRatingChange,
  comment,
  onCommentChange,
  onSubmit,
  submitting,
  submitted,
  submittedRating,
}: RatingPanelProps) {
  const theme = accentClasses(accent)

  if (submitted) {
    const displayRating = submittedRating ?? rating
    return (
      <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-5 text-center">
        <p className="font-semibold text-dark mb-3">Thank you for your feedback</p>
        <StarRating value={displayRating} readOnly accent={accent} size={28} />
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-gray-100 bg-white shadow-sm p-5">
      <h2 className="font-semibold text-dark mb-4">{title}</h2>
      <StarRating value={rating} onChange={onRatingChange} accent={accent} size={28} />
      <textarea
        placeholder="Optional comment"
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        className={`${theme.inputClass} resize-y mt-4 w-full`}
        rows={2}
      />
      <button
        type="button"
        onClick={onSubmit}
        disabled={submitting}
        className={`${theme.primaryBtn} mt-4 disabled:opacity-50`}
      >
        Submit feedback
      </button>
    </div>
  )
}
