import { useQuery } from '@tanstack/react-query'
import { CalendarDots, ClipboardText, Plus } from '@phosphor-icons/react'
import { ButtonLink, Card, EmptyState, PageHeading, TextLink } from '../components/ui'
import { useAuth } from '../features/auth/AuthContext'
import { TicketAccess } from '../features/tickets/TicketAccess'
import { TicketRow } from '../features/tickets/TicketRow'
import { allPages, type AcademicEvent } from '../lib/api/academic'
import { ticketApi, ticketDate } from '../lib/api/tickets'

function StudentHome() {
  const { user } = useAuth()
  const own = useQuery({ queryKey: ['tickets', user?.id, 'home'], queryFn: () => ticketApi.list(new URLSearchParams({ page: '1', pageSize: '3' })), enabled: !!user })
  const services = useQuery({ queryKey: ['tickets', 'services'], queryFn: ticketApi.services, enabled: !!user })
  const events = useQuery({ queryKey: ['academic', user?.id, 'next-event'], enabled: !!user,
    queryFn: async () => {
      const now = new Date()
      const to = new Date(now.getTime() + 7 * 86400000)
      const params = new URLSearchParams({ from: now.toISOString(), to: to.toISOString() })
      const list = await allPages<AcademicEvent>(`me/events?${params}`)
      return list.sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] || null
    } })
  return <div className="content-stack tickets-view">
    <PageHeading title={`Bienvenido, ${user?.displayName || 'estudiante'}`} subtitle="Consulta tus reportes y registra un problema de TI." action={<ButtonLink to="/incidencias/nueva"><Plus />Nueva incidencia</ButtonLink>} />
    <div className="tickets-summary"><Card><ClipboardText aria-hidden="true" /><strong>{own.data?.total ?? '—'}</strong><span>Mis incidencias registradas</span></Card><Card><CalendarDots aria-hidden="true" /><strong>{events.data ? ticketDate(events.data.startsAt) : '—'}</strong><span>Próxima actividad académica</span></Card></div>
    <Card><div className="tickets-card-head"><h2>Mis incidencias recientes</h2><TextLink to="/incidencias">Ver todas</TextLink></div>
      {own.isPending ? <p role="status">Cargando tus reportes…</p> : own.error ? <p role="alert">No se pudieron cargar tus reportes. <button type="button" onClick={() => void own.refetch()}>Reintentar</button></p> : own.data?.items.length ? <div className="ticket-list">{own.data.items.map(ticket => <TicketRow key={ticket.id} ticket={ticket} services={services.data} />)}</div> : <EmptyState title="Aún no tienes incidencias" description="Cuando registres un reporte, aparecerá aquí." action={<ButtonLink to="/incidencias/nueva">Crear reporte</ButtonLink>} />}
    </Card>
    <Card><h2>Actividad académica</h2>{events.isPending ? <p role="status">Consultando calendario…</p> : events.error ? <p>El calendario no está disponible en este momento.</p> : events.data ? <p>{events.data.title} · {ticketDate(events.data.startsAt)}</p> : <p>No hay actividades aplicables en los próximos siete días.</p>}</Card>
  </div>
}
export default function HomePage() { return <TicketAccess permission="tickets:read:self"><StudentHome /></TicketAccess> }
