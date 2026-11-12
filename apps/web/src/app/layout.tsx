import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from '../components/Sidebar'
import { AppHeader } from '../components/AppHeader'
import './provisional-pages.css'
import './globals.css'

export default function RootLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname, key } = useLocation()
  const sharedView = pathname === '/' || pathname.startsWith('/admin/calendario') || pathname === '/calendario' || pathname === '/admin/permisos' || pathname === '/admin/usuarios' || pathname === '/admin/privacidad'
  useEffect(() => {
    setMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [key])
  useEffect(() => {
    if (!menuOpen) return
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [menuOpen])
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Ir al contenido
      </a>
      <Sidebar menuOpen={menuOpen} />
      <div className="workspace">
        <AppHeader
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((open) => !open)}
        />
        <main id="main-content" className="main-content" tabIndex={-1}>
          {sharedView ? children : <div className="legacy-view">{children}</div>}
        </main>
        <footer className="app-footer">
          <span>
            CampusITSM <span aria-hidden="true">·</span> Universidad Privada
            Tallán
          </span>
          <span>Mesa de servicios universitarios</span>
        </footer>
      </div>
    </div>
  )
}
