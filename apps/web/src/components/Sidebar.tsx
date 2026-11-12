import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import { navigationFor } from '../features/auth/navigation'
import {
  Buildings,
  GraduationCap,
} from '@phosphor-icons/react'

export function Sidebar({ menuOpen = false }: { menuOpen?: boolean }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { primary: links, administration: adminLinks } = navigationFor(user)
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
        {links.map(({ label, icon: Icon, to }) => {
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
        {adminLinks.length > 0 && <div className="sidebar__secondary" aria-label="Administración">
          {adminLinks.map(({ label, icon: Icon, to }) => to ? <Link key={label} to={to} className={`nav-item ${pathname.startsWith(to) ? 'nav-item--active' : ''}`} aria-current={pathname.startsWith(to) ? 'page' : undefined}><Icon size={23} aria-hidden="true" />{label}</Link> : (
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
        </div>}
      </nav>
      <div className="sidebar__note">
        CampusITSM<small>Soporte a la comunidad universitaria</small>
      </div>
    </aside>
  )
}
