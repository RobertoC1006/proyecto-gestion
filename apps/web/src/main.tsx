import CoursesPage from './features/academic/CoursesPage'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import RootLayout from './app/layout'
import HomePage from './app/page'
import LoginPage from './app/login/page'
import IncidenciasPage from './app/incidencias/page'
import NuevaIncidenciaPage from './app/incidencias/nueva/page'
import ReporteRecibidoPage from './app/incidencias/registrada/page'
import ConstanciasPage from './app/constancias/page'
import VerifyCertificatePage from './app/verificar/[codigo]/page'
import TiQueuePage from './features/tickets/QueuePage'
import WorkflowDetail from './features/tickets/WorkflowDetail'
import PolicyPage from './features/tickets/PolicyPage'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CalendarPage from './features/academic/CalendarPage'
import EventForm from './features/academic/EventForm'
import PersonalCalendar from './features/academic/PersonalCalendar'
import RolePermissionsPage from './features/permissions/RolePermissionsPage'
import UsersPage from './features/users/UsersPage'
import { AuthProvider } from './features/auth/AuthContext'
import { SessionBoundary, PermissionBoundary } from './features/auth/AccessBoundary'
import { access } from './features/auth/access'
import { Notice } from './components/ui'
import './features/academic/academic.css'
import './features/tickets/tickets.css'
import { IconContext } from '@phosphor-icons/react'
import '@fontsource/dm-sans/latin-400.css'
import '@fontsource/dm-sans/latin-500.css'
import '@fontsource/dm-sans/latin-600.css'
import '@fontsource/dm-sans/latin-700.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/latin-700.css'
import '@fontsource/manrope/latin-800.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
})

function App() {
  const { pathname } = useLocation()
  if (pathname === '/login') return <LoginPage />
  if (/^\/verificar\/[^/]+\/?$/.test(pathname)) return <main className="legacy-view"><VerifyCertificatePage /></main>
  return (
    <SessionBoundary>
    <RootLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin/permisos" element={<PermissionBoundary permissions={access.permissions}><RolePermissionsPage /></PermissionBoundary>} />
        <Route path="/admin/usuarios" element={<PermissionBoundary permissions={access.users}><UsersPage /></PermissionBoundary>} />
        <Route path="/profesor/calendario/nuevo" element={<PermissionBoundary permissions={["academic:teach"]}><EventForm /></PermissionBoundary>} />
        <Route path="/profesor/calendario/:id/editar" element={<PermissionBoundary permissions={["academic:teach"]}><EventForm /></PermissionBoundary>} />
        <Route path="/admin/configuracion" element={<PermissionBoundary permissions={access.configuration}><PolicyPage /></PermissionBoundary>} />
        <Route path="/calendario" element={<PermissionBoundary permissions={access.personalCalendar}><PersonalCalendar /></PermissionBoundary>} />
        <Route path="/admin/cursos" element={<PermissionBoundary permissions={access.manageCalendar}><CoursesPage /></PermissionBoundary>} />
        <Route path="/admin/calendario" element={<PermissionBoundary permissions={access.manageCalendar}><CalendarPage /></PermissionBoundary>} />
        <Route path="/admin/calendario/nuevo" element={<PermissionBoundary permissions={access.manageCalendar}><EventForm /></PermissionBoundary>} />
        <Route path="/admin/calendario/:id/editar" element={<PermissionBoundary permissions={access.manageCalendar}><EventForm /></PermissionBoundary>} />
        <Route path="/incidencias" element={<PermissionBoundary permissions={access.personalTickets}><IncidenciasPage /></PermissionBoundary>} />
        <Route path="/incidencias/nueva" element={<PermissionBoundary permissions={access.createTicket}><NuevaIncidenciaPage /></PermissionBoundary>} />
        <Route path="/incidencias/registrada/:id" element={<PermissionBoundary permissions={access.personalTickets}><ReporteRecibidoPage /></PermissionBoundary>} />
        <Route path="/incidencias/:id" element={<PermissionBoundary permissions={access.personalTickets}><WorkflowDetail /></PermissionBoundary>} />
        <Route path="/constancias" element={<PermissionBoundary permissions={access.certificates}><ConstanciasPage /></PermissionBoundary>} />
        <Route path="/ti/cola" element={<PermissionBoundary permissions={access.teamTickets}><TiQueuePage /></PermissionBoundary>} />
        <Route path="/ti/tickets/:id" element={<PermissionBoundary permissions={access.teamTickets}><WorkflowDetail operational /></PermissionBoundary>} />
        <Route path="*" element={<Notice tone="amber" role="alert">Esta página no está disponible.</Notice>} />
      </Routes>
    </RootLayout>
    </SessionBoundary>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IconContext.Provider value={{ size: 22, weight: 'regular' }}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider><App /></AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </IconContext.Provider>
  </StrictMode>,
)
