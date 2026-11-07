import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, request } from '../../lib/api/http'
import type { components } from '../../lib/api/schema'

export type Session = components['schemas']['SessionDto']
export type CurrentUser = Session['user']
export const roleLabels: Record<string, string> = { estudiante: 'Estudiante', docente: 'Docente', ti_agente: 'Agente TI', ti_supervisor: 'Supervisor TI', administrador: 'Administrador' }
type AuthContextValue = { user: CurrentUser | null; loading: boolean; error: Error | null; refresh: () => void; logout: () => Promise<void> }
const Context = createContext<AuthContextValue | null>(null)
export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useQueryClient()
  const session = useQuery({ queryKey: ['auth', 'session'], queryFn: async () => {
    try { return await request<Session>('auth/me') } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null
      throw error
    }
  }, retry: false, staleTime: 30000, refetchOnWindowFocus: true, refetchInterval: query => query.state.data ? 60000 : false })
  const previous = useRef<string | null>(null)
  const user = session.data?.user || null
  useEffect(() => {
    if (previous.current && previous.current !== user?.id) {
      void client.cancelQueries({ predicate: q => q.queryKey[0] !== 'auth' })
      client.removeQueries({ predicate: q => q.queryKey[0] !== 'auth' })
    }
    previous.current = user?.id || null
  }, [user?.id, client])
  useEffect(() => {
    const expire = () => { void client.invalidateQueries({ queryKey: ['auth', 'session'] }) }
    window.addEventListener('campus:session-expired', expire)
    return () => window.removeEventListener('campus:session-expired', expire)
  }, [client])
  async function logout() {
    const result = await request<{ message: string; providerRevoked: boolean }>('auth/logout', { method: 'POST', body: '{}' })
    await client.cancelQueries()
    client.removeQueries({ predicate: q => q.queryKey[0] !== 'auth' })
    client.setQueryData(['auth', 'session'], null)
    window.location.assign(`/login${result.providerRevoked ? '' : '?closed=local'}`)
  }
  return <Context.Provider value={{ user, loading: session.isPending, error: session.error, refresh: () => { void session.refetch() }, logout }}>{children}</Context.Provider>
}
export function useAuth() {
  const value = useContext(Context)
  if (!value) throw new Error('AuthProvider requerido')
  return value
}
