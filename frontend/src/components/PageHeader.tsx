'use client'

interface PageHeaderProps {
  title: string
  onBack?: () => void
  backHref?: string
  rightAction?: React.ReactNode
}

export function PageHeader({ title, onBack, rightAction }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-dark hover:bg-gray-50 shrink-0"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      ) : (
        <div className="w-10 shrink-0" />
      )}
      <h1 className="text-lg font-bold text-dark text-center flex-1">{title}</h1>
      <div className="w-10 shrink-0 flex justify-end">{rightAction}</div>
    </header>
  )
}
