export class SessionExpiredError extends Error {
  constructor() {
    super('Your session has expired. Please log in again.')
    this.name = 'SessionExpiredError'
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('auth_token')
}

export async function fetchWithAuth(
  url: string,
  init?: RequestInit,
  onUnauthorized?: () => void,
): Promise<Response> {
  const token = getAuthToken()
  const headers = new Headers(init?.headers)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(url, { ...init, headers })

  if (response.status === 401) {
    onUnauthorized?.()
    throw new SessionExpiredError()
  }

  return response
}
