'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { LogoMark } from '@/components/LogoMark'
import { ModeNav, AppMode, modeSubtitle } from '@/components/ModeNav'

interface AppShellProps {
  mode: AppMode
  children: ReactNode
  showModeNav?: boolean
  variant?: 'default' | 'minimal'
}

export function AppShell({
  mode,
  children,
  showModeNav = true,
  variant = 'default',
}: AppShellProps) {
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const shellBg = variant === 'minimal' ? 'bg-white' : mode === 'host' ? 'bg-host-cream' : 'bg-white'

  if (variant === 'minimal') {
    return (
      <div className={`min-h-screen ${shellBg}`}>
        <main className="max-w-xl mx-auto px-4 py-6">{children}</main>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${shellBg}`}>
      <header className={`${shellBg} border-b border-gray-100`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <LogoMark size={40} variant="mark" />
            </Link>
            <div>
              <Link href="/dashboard" className="text-xl font-bold text-primary hover:opacity-90">
                Match for Space
              </Link>
              <p className="text-gray-600 text-sm">{modeSubtitle(mode)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {showModeNav && <ModeNav active={mode} />}
            <button type="button" onClick={handleLogout} className="btn-secondary text-sm">
              Log Out
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
