import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, ButtonLink, Card, Notice } from '../../components/ui'
import { useAuth } from './AuthContext'
import { hasAccess, HOME_PATH } from './access'

export function SessionBoundary({ children }: { children: ReactNode }) {
  const { user, loading, error, refresh } = useAuth()
  if (loading) return <main className="session-status"><p role="status">Comprobando tu sesión…</p></main>
  if (error) return <main className="session-status"><Card className="auth-card"><Notice tone="amber" role="alert">No pudimos comprobar tu sesión. Revisa tu conexión e inténtalo de nuevo.</Notice><Button onClick={refresh}>Reintentar</Button></Card></main>
  if (!user?.active) return <Navigate to="/login" replace />
  return children
}

export function PermissionBoundary({ permissions, children }: { permissions: readonly string[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!hasAccess(user, permissions)) return <div className="content-stack"><Notice tone="amber" role="alert">No tienes permiso para acceder a este módulo.</Notice>{user && <ButtonLink to={HOME_PATH} variant="secondary">Volver al inicio</ButtonLink>}</div>
  return children
}
