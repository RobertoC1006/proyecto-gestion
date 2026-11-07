// Solo CSRF en memoria. Cookie HttpOnly y tokens de Supabase inaccesibles al cliente.
let csrfToken: string | null = null
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public fields: Record<string, string> = {}) { super(message) }
}
const publicWrites = new Set(['auth/login', 'auth/register', 'auth/recovery/request', 'auth/recovery/reset'])
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const writing = !['GET', 'HEAD'].includes((options.method || 'GET').toUpperCase())
  if (writing && !publicWrites.has(path) && !csrfToken) {
    const session = await request<{ csrfToken: string }>('auth/me')
    csrfToken = session.csrfToken
  }
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (writing && csrfToken && !headers.has('X-CSRF-Token')) headers.set('X-CSRF-Token', csrfToken)
  const response = await fetch(`/api/v1/${path}`, { ...options, headers, credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) {
    if (response.status === 401) {
      csrfToken = null
      if (path !== 'auth/me' && !publicWrites.has(path)) window.dispatchEvent(new Event('campus:session-expired'))
    }
    const error = await response.json().catch(() => ({}))
    throw new ApiError(response.status, error.code || 'REQUEST_FAILED', error.message || 'No se pudo completar la solicitud. Inténtalo nuevamente.', error.fields)
  }
  const result = await response.json()
  if (path === 'auth/me' || path === 'auth/login') csrfToken = result.csrfToken
  if (path === 'auth/logout' || path === 'auth/recovery/reset') csrfToken = null
  return result as T
}
