import { BookOpen, CalendarDots, ChartBar, ClipboardText, Gear, House, Key, ShieldCheck, Users, type Icon } from '@phosphor-icons/react'
import type { CurrentUser } from './AuthContext'
import { access, hasAccess } from './access'

export type NavigationItem = {
  label: string
  description: string
  icon: Icon
  to?: string
  permissions: readonly string[]
}

const dashboard: NavigationItem = { label: 'Dashboard', description: 'Tu espacio de trabajo en CampusITSM.', icon: House, to: '/', permissions: [] }
const navigation: NavigationItem[] = [
  { label: 'Tickets', description: 'Consulta tus incidencias y su seguimiento.', icon: ClipboardText, to: '/incidencias', permissions: access.personalTickets },
  { label: 'Calendario académico', description: 'Organiza los eventos, cursos y secciones de la institución.', icon: CalendarDots, to: '/admin/calendario', permissions: [...access.personalCalendar, ...access.manageCalendar] },
  { label: 'Reportes', description: 'Consulta los reportes correspondientes a tu alcance.', icon: ChartBar, permissions: access.reports },
  { label: 'Operaciones de TI', description: 'Accede a la cola de atención de tu equipo.', icon: ShieldCheck, to: '/ti/cola', permissions: access.teamTickets },
]
const administration: NavigationItem[] = [
  { label: 'Usuarios', description: 'Administra las cuentas, sus roles y su estado de acceso.', icon: Users, to: '/admin/usuarios', permissions: access.users },
  { label: 'Permisos', description: 'Configura las capacidades y alcances de cada rol.', icon: Key, to: '/admin/permisos', permissions: access.permissions },
  { label: 'Configuración', description: 'Administra las opciones de la institución.', icon: Gear, permissions: access.configuration },
  { label: 'Auditoría', description: 'Consulta el registro de cambios y acciones.', icon: BookOpen, permissions: access.audit },
]

export function navigationFor(user: CurrentUser | null) {
  if (!user?.active) return { primary: [], administration: [] }
  return {
    primary: [dashboard, ...navigation.filter(item => hasAccess(user, item.permissions)).map(item =>
      item.to === '/admin/calendario' && !hasAccess(user, access.manageCalendar)
        ? { ...item, to: '/calendario', description: 'Consulta los eventos de tu institución y de tus cursos.' }
        : item)],
    administration: administration.filter(item => hasAccess(user, item.permissions)),
  }
}
