export interface SpacePhoto {
  photo_id: string
  image_url: string | null
  position: number | null
}

export interface SpaceListing {
  id: string
  name: string
  owner_id: string
  area_m2: number | null
  is_outdoor: boolean | null
  category: string | null
  availability: string | null
  deposit_needed: number | null
  location: string | null
  description: string | null
  rules: string | null
  exchange_preferences: string | null
  image_url: string | null
  photos?: SpacePhoto[]
}

export function resolveImageUrl(imageUrl: string | null, apiUrl: string): string | null {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http')) return imageUrl
  return `${apiUrl}${imageUrl}`
}

export function outdoorLabel(isOutdoor: boolean | null): string {
  if (isOutdoor === true) return 'Outdoor'
  if (isOutdoor === false) return 'Indoor'
  return 'Indoor/Outdoor'
}
