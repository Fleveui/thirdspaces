'use client'

import Link from 'next/link'
import { SpaceListing, resolveImageUrl, availabilityBadge } from '@/lib/spaces'
import { hostRequestsHref } from '@/lib/hostNavigation'
import { accentClasses } from '@/lib/theme'
import { BookmarkButton } from '@/components/BookmarkButton'

interface SpaceCardProps {
  space: SpaceListing
  apiUrl: string
  layout?: 'card' | 'row'
  accent?: 'find' | 'host'
  requestCount?: number
  isFavorite?: boolean
  onToggleFavorite?: () => void
}

export function SpaceCard({
  space,
  apiUrl,
  layout = 'card',
  accent = 'find',
  requestCount,
  isFavorite = false,
  onToggleFavorite,
}: SpaceCardProps) {
  const img = resolveImageUrl(space.image_url, apiUrl)
  const badge = availabilityBadge(space.availability)
  const theme = accentClasses(accent)

  if (layout === 'row') {
    const showRequestBadge = requestCount !== undefined && requestCount > 0

    return (
      <div className="flex gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow p-3">
        <Link href={`/spaces/${space.id}`} className="flex gap-4 flex-1 min-w-0">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl ${theme.imageBg} flex items-center justify-center overflow-hidden`}>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt={space.name} className="w-full h-full object-cover" />
            ) : (
              <span className={`${theme.placeholderText} text-xs`}>No photo</span>
            )}
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <h2 className="font-bold text-dark leading-tight truncate">{space.name}</h2>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                <path d="M12 21s-7-4.5-7-10a7 7 0 1114 0c0 5.5-7 10-7 10z" />
                <circle cx="12" cy="11" r="2" />
              </svg>
              {space.location || 'Bolzano'}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {space.category && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${theme.categoryBadge}`}>
                  {space.category}
                </span>
              )}
              {space.area_m2 != null && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  {space.area_m2} m²
                </span>
              )}
              {space.max_people != null && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  max {space.max_people}
                </span>
              )}
              {requestCount === undefined && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
                    badge.variant === 'available'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {badge.label}
                </span>
              )}
            </div>
          </div>
        </Link>
        {showRequestBadge && (
          <Link
            href={hostRequestsHref(space.id)}
            className={`shrink-0 self-center inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-full transition-colors ${theme.requestBadge}`}
            aria-label={`${requestCount} booking request${requestCount === 1 ? '' : 's'}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-host-cream-accent shrink-0">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {requestCount} {requestCount === 1 ? 'request' : 'requests'}
          </Link>
        )}
        {onToggleFavorite && (
          <BookmarkButton
            filled={isFavorite}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite()
            }}
            className="shrink-0 self-center w-10 h-10 rounded-full hover:bg-primary-light/60 text-primary"
            size={20}
          />
        )}
      </div>
    )
  }

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className={`h-44 ${theme.imageBg} flex items-center justify-center`}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={space.name} className="w-full h-full object-cover" />
        ) : (
          <span className={`${theme.placeholderText} text-sm`}>No photo</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h2 className="font-bold text-dark leading-tight">{space.name}</h2>
        </div>
        <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M12 21s-7-4.5-7-10a7 7 0 1114 0c0 5.5-7 10-7 10z" />
            <circle cx="12" cy="11" r="2" />
          </svg>
          {space.location || 'Bolzano'}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {space.category && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${theme.categoryBadge}`}>
              {space.category}
            </span>
          )}
          {space.area_m2 != null && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              {space.area_m2} m²
            </span>
          )}
          {space.max_people != null && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
              max {space.max_people}
            </span>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
            badge.variant === 'available'
              ? 'bg-green-50 text-green-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          {badge.variant === 'available' && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          )}
          {badge.label}
        </span>
      </div>
    </Link>
  )
}
