export const SPACE_CATEGORIES = [
  'Physical activity',
  'Exhibition',
  'Crafting',
  'Culinary experience',
  'Workshop',
  'Conference',
  'Music',
] as const

export const EXCHANGE_OPTIONS = [
  'Artist keeps the space clean and tidy',
  'Artist provides documentation of their use',
  'Brief introduction call before booking',
  'Space used for community benefit',
] as const

export const LISTING_DEFAULTS = {
  location: 'Bolzano',
  availability: 'Flexible',
  description:
    'Facilities, access details, and any conditions of use can be discussed with the host before booking.',
  maxPeople: 10,
  areaM2: 50,
} as const

export type SpaceCategory = (typeof SPACE_CATEGORIES)[number]

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
  max_people: number | null
  location: string | null
  description: string | null
  rules: string | null
  exchange_preferences: string | null
  image_url: string | null
  photos?: SpacePhoto[]
}

export interface SpaceFilters {
  category: string
  is_outdoor: string
  min_area: string
  max_area: string
  min_people: string
  max_people: string
  location: string
  availability: string
}

export const emptyFilters = (): SpaceFilters => ({
  category: '',
  is_outdoor: '',
  min_area: '',
  max_area: '',
  min_people: '',
  max_people: '',
  location: '',
  availability: '',
})

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

export function availabilityBadge(availability: string | null): { label: string; variant: 'available' | 'soon' } {
  if (!availability?.trim()) {
    return { label: 'Available now', variant: 'available' }
  }
  const lower = availability.toLowerCase()
  if (lower.includes('weekend') || lower.includes('daily') || lower.includes('flexible') || lower.includes('hourly')) {
    return { label: 'Available now', variant: 'available' }
  }
  return { label: availability, variant: 'soon' }
}

export function buildSpacesQuery(filters: SpaceFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.category) params.set('category', filters.category)
  if (filters.is_outdoor !== '') params.set('is_outdoor', filters.is_outdoor)
  if (filters.min_area) params.set('min_area', filters.min_area)
  if (filters.max_area) params.set('max_area', filters.max_area)
  if (filters.min_people) params.set('min_people', filters.min_people)
  if (filters.max_people) params.set('max_people', filters.max_people)
  if (filters.location) params.set('location', filters.location)
  if (filters.availability) params.set('availability', filters.availability)
  return params
}
