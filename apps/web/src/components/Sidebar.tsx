import { Link, useLocation } from 'react-router-dom'
import {
  Pulse as Activity,
  BookOpen,
  Buildings,
  CalendarDots,
  ChartBar,
  ClipboardText,
  Gear,
  GraduationCap,
  House,
  Key,
  LockKey,
  ShieldCheck,
  Users,
  type Icon,
} from '@phosphor-icons/react'

const navigation: { label: string; icon: Icon; to?: string }[] = [
  { label: 'Dashboard', icon: House, to: '/' },
  { label: 'Tickets', icon: ClipboardText, to: '/incidencias' },
  {
    label: 'Calendario académico',
    icon: CalendarDots,
    to: '/admin/calendario',
  },
  { label: 'Reportes', icon: ChartBar },
  { label: 'Modelos', icon: Activity },
  { label: 'Operaciones de TI', icon: ShieldCheck, to: '/ti/cola' },
]
const administration: { label: string; icon: Icon }[] = [
  { label: 'Usuarios', icon: Users },
  { label: 'Permisos', icon: Key },
  { label: 'Configuración', icon: Gear },
  { label: 'Privacidad', icon: LockKey },
  { label: 'Auditoría', icon: BookOpen },
]

export function Sidebar({ menuOpen = false }: { menuOpen?: boolean }) {
  const { pathname } = useLocation()
  return (
    <aside
      id="app-navigation"
      className={`sidebar ${menuOpen ? 'sidebar--open' : ''}`}
    >
      <Link to="/" className="brand" aria-label="CampusITSM, inicio">
        <GraduationCap
          className="brand__icon"
          size={43}
          weight="duotone"
          aria-hidden="true"
        />
        <span>
          <strong>CampusITSM</strong>
          <small>Mesa de servicios</small>
        </span>
      </Link>
      <div className="organization">
        <Buildings size={21} aria-hidden="true" />
        <span>Universidad Privada Tallán</span>
      </div>
      <nav className="sidebar__nav" aria-label="Navegación principal">
        {navigation.map(({ label, icon: Icon, to }) => {
          const active =
            to === '/' ? pathname === '/' : !!to && pathname.startsWith(to)
          return to ? (
            <Link
              key={label}
              to={to}
              className={`nav-item ${active ? 'nav-item--active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={23} aria-hidden="true" />
              {label}
            </Link>
          ) : (
            <span
              key={label}
              className="nav-item nav-item--unavailable"
              aria-disabled="true"
              title="Esta sección todavía no está disponible"
            >
              <Icon size={23} aria-hidden="true" />
              {label}
            </span>
          )
        })}
        <div className="sidebar__secondary" aria-label="Administración">
          {administration.map(({ label, icon: Icon }) => (
            <span
              className="nav-item nav-item--unavailable"
              key={label}
              aria-disabled="true"
              title="Esta sección todavía no está disponible"
            >
              <Icon size={23} aria-hidden="true" />
              {label}
            </span>
          ))}
        </div>
      </nav>
      <div className="sidebar__note">
        CampusITSM<small>Soporte a la comunidad universitaria</small>
      </div>
    </aside>
  )
}
