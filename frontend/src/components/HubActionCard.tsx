'use client'

import Link from 'next/link'

interface HubActionCardProps {
  variant: 'find' | 'host'
  href: string
}

function CardIllustration({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={96}
      height={116}
      className="absolute right-8 bottom-3 w-24 h-auto pointer-events-none mix-blend-screen opacity-100 contrast-[1.5] brightness-105"
      aria-hidden
    />
  )
}

export function HubActionCard({ variant, href }: HubActionCardProps) {
  if (variant === 'find') {
    return (
      <Link
        href={href}
        className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-6 text-white min-h-[140px] hover:opacity-95 transition-opacity"
      >
        <div className="relative z-10">
          <h2 className="text-xl font-bold mb-1">Find a space</h2>
          <p className="text-sm text-white/85 max-w-[200px]">
            Browse available spaces for your creative practice
          </p>
        </div>
        <CardIllustration src="/illustrations/find-space.png" />
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="relative block overflow-hidden rounded-3xl bg-gradient-to-br from-host-cream-light to-host-cream p-6 text-dark min-h-[140px] hover:opacity-95 transition-opacity"
    >
      <div className="relative z-10">
        <h2 className="text-xl font-bold text-white mb-1">List your space</h2>
        <p className="text-sm text-dark/70 max-w-[200px]">
          Share your vacant space with local users
        </p>
      </div>
      <CardIllustration src="/illustrations/list-space.png" />
    </Link>
  )
}

interface IncomingRequestsStripProps {
  href: string
  count: number
}

export function IncomingRequestsStrip({ href, count }: IncomingRequestsStripProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 w-full rounded-3xl px-5 py-4 bg-host-cream-light/50 hover:bg-host-cream-light/60 transition-colors"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-host-cream-accent shrink-0">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
      <span className="font-semibold text-dark flex-1">Incoming requests</span>
      {count > 0 && (
        <span className="w-7 h-7 rounded-full bg-host-cream text-dark text-sm font-bold flex items-center justify-center border border-host-cream-accent/25">
          {count}
        </span>
      )}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

interface MyBookingRequestsStripProps {
  href: string
  count: number
}

export function MyBookingRequestsStrip({ href, count }: MyBookingRequestsStripProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 w-full rounded-3xl bg-primary-light/60 px-5 py-4 hover:bg-primary-light transition-colors"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary shrink-0">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <span className="font-semibold text-dark flex-1">My booking requests</span>
      {count > 0 && (
        <span className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
          {count}
        </span>
      )}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}

interface SavedFavoritesStripProps {
  href: string
  count: number
}

export function SavedFavoritesStrip({ href, count }: SavedFavoritesStripProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 w-full rounded-3xl bg-primary-light/60 px-5 py-4 hover:bg-primary-light transition-colors"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" className="text-primary shrink-0">
        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
      </svg>
      <span className="font-semibold text-dark flex-1">Saved favorites</span>
      {count > 0 && (
        <span className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center">
          {count}
        </span>
      )}
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  )
}
