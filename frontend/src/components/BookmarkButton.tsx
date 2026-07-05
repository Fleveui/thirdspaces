'use client'

interface BookmarkButtonProps {
  filled?: boolean
  onClick?: (e: React.MouseEvent) => void
  className?: string
  size?: number
  ariaLabel?: string
}

export function BookmarkButton({
  filled = false,
  onClick,
  className = '',
  size = 22,
  ariaLabel,
}: BookmarkButtonProps) {
  const label = ariaLabel ?? (filled ? 'Remove from favorites' : 'Save to favorites')

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center justify-center ${className}`}
      aria-label={label}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
    </button>
  )
}
