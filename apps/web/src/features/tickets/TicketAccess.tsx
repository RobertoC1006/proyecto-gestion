import { ButtonLink, Notice } from '../../components/ui'
import { useAuth } from '../auth/AuthContext'

export function TicketAccess({ permission, children }: { permission: string; children: React.ReactNode }) {
  const { user, loading, error } = useAuth()
  if (loading) return <Notice role="status">Comprobando tu sesión…</Notice>
  if (error) return <Notice tone="amber" role="alert">No se pudo comprobar la sesión. Actualiza la página e inténtalo de nuevo.</Notice>
  if (!user) return <Notice tone="amber" role="alert"><strong>Inicia sesión para continuar.</strong><p><ButtonLink to="/login" variant="secondary">Ir a acceso</ButtonLink></p></Notice>
  if (!user.permissions.includes(permission)) return <Notice tone="amber" role="alert">Tu cuenta no tiene acceso a esta función.</Notice>
  return <>{children}</>
}
