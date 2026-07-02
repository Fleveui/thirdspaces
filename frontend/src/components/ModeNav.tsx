'use client'

import Link from 'next/link'

export type AppMode = 'find' | 'host' | 'hub'

interface ModeNavProps {
  active: AppMode
}

export function modeSubtitle(active: AppMode): string {
  switch (active) {
    case 'find':
      return 'Finding spaces'
    case 'host':
      return 'Managing your spaces'
    default:
      return 'Home'
  }
}

export function ModeNav({ active }: ModeNavProps) {
  return (
    <nav className="flex rounded-2xl border border-primary/20 p-1 bg-white gap-1">
      <Link
        href="/find"
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          active === 'find'
            ? 'bg-primary text-white'
            : 'text-primary hover:bg-primary-light'
        }`}
      >
        Find a space
      </Link>
      <Link
        href="/host"
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
          active === 'host'
            ? 'bg-primary text-white'
            : 'text-primary hover:bg-primary-light'
        }`}
      >
        My spaces
      </Link>
    </nav>
  )
}
