import { CalendarDots } from '@phosphor-icons/react'
import { PageHeading } from '../../components/ui'

export function AcademicBanner({
  form = false,
  editing = false,
}: {
  form?: boolean
  editing?: boolean
}) {
  return (
    <PageHeading
      illustrationIcon={CalendarDots}
      title={
        form
          ? editing
            ? 'Editar evento académico'
            : 'Crear evento académico'
          : 'Calendario académico'
      }
      subtitle={
        form
          ? editing
            ? 'Actualiza las fechas y el alcance del evento.'
            : 'Registra un nuevo evento académico de forma manual.'
          : 'Gestión de eventos académicos por curso y sección.'
      }
    />
  )
}
