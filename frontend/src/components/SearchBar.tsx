'use client'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSubmit?: () => void
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search by name, city, or type...',
  onSubmit,
}: SearchBarProps) {
  return (
    <form
      className="relative"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit?.()
      }}
    >
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/60 pointer-events-none">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-11 rounded-3xl bg-primary-light/50"
      />
    </form>
  )
}
