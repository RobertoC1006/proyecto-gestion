import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import RootLayout from './app/layout'
import HomePage from './app/page'
import LoginPage from './app/login/page'
import IncidenciasPage from './app/incidencias/page'
import NuevaIncidenciaPage from './app/incidencias/nueva/page'
import IncidenciaDetailPage from './app/incidencias/[id]/page'
import ConstanciasPage from './app/constancias/page'
import VerifyCertificatePage from './app/verificar/[codigo]/page'
import TiQueuePage from './app/ti/cola/page'
import TiTicketDetailPage from './app/ti/tickets/[id]/page'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import CalendarPage from './features/academic/CalendarPage'
import EventForm from './features/academic/EventForm'
import './features/academic/academic.css'
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

function ViewRouter() {
  const path = window.location.pathname

  if (path === '/login') return <LoginPage />
  if (path === '/incidencias') return <IncidenciasPage />
  if (path === '/incidencias/nueva') return <NuevaIncidenciaPage />
  if (path.startsWith('/incidencias/')) return <IncidenciaDetailPage />
  if (path === '/constancias') return <ConstanciasPage />
  if (path.startsWith('/verificar/')) return <VerifyCertificatePage />
  if (path === '/ti/cola') return <TiQueuePage />
  if (path.startsWith('/ti/tickets/')) return <TiTicketDetailPage />
  return <HomePage />
}

function App() {
  return (
    <RootLayout>
      <Routes>
        <Route path="/admin/calendario" element={<CalendarPage />} />
        <Route path="/admin/calendario/nuevo" element={<EventForm />} />
        <Route path="/admin/calendario/:id/editar" element={<EventForm />} />
        <Route path="*" element={<ViewRouter />} />
      </Routes>
    </RootLayout>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IconContext.Provider value={{ size: 22, weight: 'regular' }}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </IconContext.Provider>
  </StrictMode>,
)
