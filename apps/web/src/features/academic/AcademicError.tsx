import { LockKey, WarningCircle } from '@phosphor-icons/react'
import { Button, ButtonLink, Notice } from '../../components/ui'
import { ApiError } from '../../lib/api/academic'

export function AcademicError({
  error,
  retry,
}: {
  error: unknown
  retry?: () => void
}) {
  const denied = error instanceof ApiError && [401, 403].includes(error.status)
  return (
    <Notice
      tone="amber"
      icon={denied ? LockKey : WarningCircle}
      role="alert"
      className="academic-message"
    >
      <strong>
        {denied ? 'Acceso al calendario' : 'No se pudo cargar la información'}
      </strong>
      <p>
        {error instanceof Error
          ? error.message
          : 'Revisa tu conexión e inténtalo nuevamente.'}
      </p>
      {error instanceof ApiError && error.status === 401 && <ButtonLink to="/login" variant="secondary">Iniciar sesión</ButtonLink>}
      {!denied && retry && (
        <Button variant="ghost" onClick={retry}>
          Reintentar
        </Button>
      )}
    </Notice>
  )
}
