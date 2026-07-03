export function hostRequestsHref(spaceId?: string): string {
  if (spaceId) return `/host/requests?space_id=${encodeURIComponent(spaceId)}`
  return '/host/requests'
}

export function hostRequestsBackHref(spaceId: string | null): string {
  if (spaceId) return `/spaces/${spaceId}`
  return '/dashboard'
}
