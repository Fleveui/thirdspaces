import { SpaceListing } from '@/lib/spaces'

export async function fetchFavorites(
  authFetch: (url: string, init?: RequestInit) => Promise<Response>,
  apiUrl: string
): Promise<SpaceListing[]> {
  const response = await authFetch(`${apiUrl}/api/favorites`)
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Failed to fetch favorites')
  }
  return response.json()
}

export async function fetchFavoriteStatus(
  authFetch: (url: string, init?: RequestInit) => Promise<Response>,
  apiUrl: string,
  spaceId: string
): Promise<boolean> {
  const response = await authFetch(`${apiUrl}/api/favorites/${spaceId}`)
  if (!response.ok) return false
  const data = await response.json()
  return Boolean(data.favorited)
}

export async function addFavorite(
  authFetch: (url: string, init?: RequestInit) => Promise<Response>,
  apiUrl: string,
  spaceId: string
): Promise<void> {
  const response = await authFetch(`${apiUrl}/api/favorites/${spaceId}`, {
    method: 'POST',
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Failed to save favorite')
  }
}

export async function removeFavorite(
  authFetch: (url: string, init?: RequestInit) => Promise<Response>,
  apiUrl: string,
  spaceId: string
): Promise<void> {
  const response = await authFetch(`${apiUrl}/api/favorites/${spaceId}`, {
    method: 'DELETE',
  })
  if (!response.ok && response.status !== 404) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Failed to remove favorite')
  }
}

export function favoriteIdsFromList(spaces: SpaceListing[]): Set<string> {
  return new Set(spaces.map((s) => s.id))
}
