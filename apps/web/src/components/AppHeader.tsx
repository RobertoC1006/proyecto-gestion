import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth, roleLabels } from '../features/auth/AuthContext'
import { Button } from './ui'
import {
  Bell,
  CaretDown,
  List,
  MagnifyingGlass,
  User,
  Users,
  X,
} from '@phosphor-icons/react'

export function AppHeader({
  menuOpen,
  onToggleMenu,
}: {
  menuOpen: boolean
  onToggleMenu: () => void
}) {
  const { user, logout, loading } = useAuth()
  const [error, setError] = useState(''), [closing, setClosing] = useState(false)
  async function closeSession() {
    setClosing(true); setError('')
    try { await logout() } catch { setError('No se pudo cerrar la sesión. Inténtalo nuevamente.'); setClosing(false) }
  }
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== 'Escape') return
      if (
        !(event instanceof KeyboardEvent) &&
        ref.current?.contains(event.target as Node)
      )
        return
      ref.current
        ?.querySelectorAll('details[open]')
        .forEach((item) => item.removeAttribute('open'))
    }
    document.addEventListener('click', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('click', close)
      document.removeEventListener('keydown', close)
    }
  }, [])
  return (
    <header className="topbar" ref={ref}>
      <button
        type="button"
        className="icon-button mobile-menu-toggle"
        onClick={onToggleMenu}
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuOpen}
        aria-controls="app-navigation"
      >
        {menuOpen ? <X size={24} /> : <List size={24} />}
      </button>
      <div className="global-search">
        <MagnifyingGlass size={21} aria-hidden="true" />
        <input
          disabled
          aria-label="Búsqueda general no disponible"
          placeholder="Buscar en el sistema..."
        />
      </div>
      <div className="topbar__right">
        <span className="team-label">
          <Users size={23} aria-hidden="true" />
          {user ? roleLabels[user.role] : 'CampusITSM'}
        </span>
        <button
          className="icon-button notification-button"
          disabled
          aria-label="Notificaciones no disponibles"
        >
          <Bell size={25} />
        </button>
        <span className="topbar__divider" />
        <details className="header-dropdown">
          <summary className="profile-button" aria-label={`Opciones de cuenta, ${user?.displayName || 'sin sesión'}`}>
            <span className="avatar">
              <User size={23} aria-hidden="true" />
            </span>
            <span className="profile-button__name">{user?.displayName || (loading ? 'Comprobando…' : 'Sin sesión')}</span>
            <CaretDown size={17} aria-hidden="true" />
          </summary>
          <div className="dropdown-panel profile-panel">
            <h2>{user ? roleLabels[user.role] : 'Acceso a CampusITSM'}</h2>
            <p className="body-muted">{user?.email || 'Inicia sesión para acceder a tus herramientas.'}</p>
            {error && <p role="alert">{error}</p>}
            {user ? <Button variant="ghost" onClick={closeSession} disabled={closing}>{closing ? 'Cerrando sesión…' : 'Cerrar sesión'}</Button> : <Link className="text-link" to="/login">Iniciar sesión</Link>}
          </div>
        </details>
      </div>
    </header>
  )
}
