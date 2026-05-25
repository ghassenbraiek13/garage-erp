/** Valeurs par défaut alignées sur garageflow-backend (PORT 5000) et frontend/Dockerfile. */
const DEV_API_BASE = 'http://localhost:5000/api/v1'
const DEV_SOCKET_URL = 'http://localhost:5000'

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '')
}

export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined
  if (fromEnv) return trimTrailingSlash(fromEnv)
  if (import.meta.env.DEV) return DEV_API_BASE
  return ''
}

export function getSocketUrl(): string {
  const fromEnv = import.meta.env.VITE_SOCKET_URL as string | undefined
  if (fromEnv) return trimTrailingSlash(fromEnv)
  if (import.meta.env.DEV) return DEV_SOCKET_URL
  return ''
}
