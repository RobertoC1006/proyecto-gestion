import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarDots, ClipboardText, Plus } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { ButtonLink, Card, CardHeading, EmptyState, IconBubble, PageHeading, TextLink } from '../components/ui'
import { roleLabels, useAuth } from '../features/auth/AuthContext'
import { navigationFor, type NavigationItem } from '../features/auth/navigation'
import { hasAccess, access } from '../features/auth/access'
import { TicketRow } from '../features/tickets/TicketRow'
import { allPages, type AcademicEvent } from '../lib/api/academic'
import { ticketApi, ticketDate } from '../lib/api/tickets'
import '../features/home/home.css'

function ModuleList({ title, items }: { title: string; items: NavigationItem[] }) {
  if (!items.length) return null
  return <Card className="home-modules"><CardHeading title={title} /><ul className="home-module-list">
    {items.map(item => {
      const content = <><IconBubble icon={item.icon} small tone={item.to ? 'green' : 'gray'} /><span className="home-module-copy"><strong>{item.label}</strong><span>{item.description}</span></span>{item.to ? <ArrowRight className="home-module-arrow" size={20} aria-hidden="true" /> : <span className="home-module-status">Próximamente</span>}</>
      return <li key={item.label}>{item.to ? <Link className="home-module" to={item.to}>{content}</Link> : <div className="home-module home-module--pending" aria-disabled="true">{content}</div>}</li>
    })}
  </ul></Card>
}

function TicketHome({ userId }: { userId: string }) {
  const own = useQuery({ queryKey: ['tickets', userId, 'home'], queryFn: () => ticketApi.list(new URLSearchParams({ page: '1', pageSize: '3' })) })
  const services = useQuery({ queryKey: ['tickets', 'services'], queryFn: ticketApi.services })
  const events = useQuery({ queryKey: ['academic', userId, 'next-event'], queryFn: async () => {
    const now = new Date(); const to = new Date(now.getTime() + 7 * 86400000)
    const params = new URLSearchParams({ from: now.toISOString(), to: to.toISOString() })
    const list = await allPages<AcademicEvent>(`me/events?${params}`)
    return list.sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] || null
  } })
  return <>
    <div className="tickets-summary"><Card><ClipboardText aria-hidden="true" /><strong>{own.data?.total ?? '—'}</strong><span>Mis incidencias registradas</span></Card><Card><CalendarDots aria-hidden="true" /><strong>{events.data ? ticketDate(events.data.startsAt) : '—'}</strong><span>Próxima actividad académica</span></Card></div>
    <Card><div className="tickets-card-head"><h2>Mis incidencias recientes</h2><TextLink to="/incidencias">Ver todas</TextLink></div>
      {own.isPending ? <p role="status">Cargando tus reportes…</p> : own.error ? <p role="alert">No se pudieron cargar tus reportes. <button type="button" onClick={() => void own.refetch()}>Reintentar</button></p> : own.data?.items.length ? <div className="ticket-list">{own.data.items.map(ticket => <TicketRow key={ticket.id} ticket={ticket} services={services.data} />)}</div> : <EmptyState title="Aún no tienes incidencias" description="Cuando registres un reporte, aparecerá aquí." action={<ButtonLink to="/incidencias/nueva">Crear reporte</ButtonLink>} />}
    </Card>
    <Card><h2>Actividad académica</h2>{events.isPending ? <p role="status">Consultando calendario…</p> : events.error ? <p role="alert">El calendario no está disponible. <button type="button" onClick={() => void events.refetch()}>Reintentar</button></p> : events.data ? <p>{events.data.title} · {ticketDate(events.data.startsAt)}</p> : <p>No hay actividades aplicables en los próximos siete días.</p>}</Card>
  </>
}

export default function HomePage() {
  const { user } = useAuth()
  if (!user) return null
  const modules = navigationFor(user)
  const primary = modules.primary.filter(item => item.to !== '/')
  const canReadTickets = hasAccess(user, access.personalTickets)
  return <div className={`content-stack ${canReadTickets ? 'tickets-view' : ''} home-page`}>
    <PageHeading title={`Hola, ${user.displayName}`} subtitle={canReadTickets ? 'Consulta tus reportes y registra un problema de TI.' : 'Elige una herramienta para continuar con tus actividades.'} illustration={false}
      action={canReadTickets ? <ButtonLink to="/incidencias/nueva"><Plus />Nueva incidencia</ButtonLink> : <span className="badge home-role">{roleLabels[user.role]}</span>}>
      <span className="home-eyebrow">Tu espacio en CampusITSM</span>
    </PageHeading>
    {canReadTickets && <TicketHome userId={user.id} />}
    <ModuleList title="Tus herramientas" items={primary} />
    <ModuleList title="Administración" items={modules.administration} />
    {!canReadTickets && !primary.length && !modules.administration.length && <Card><EmptyState title="Todavía no tienes herramientas asignadas" description="Contacta con administración para revisar los accesos de tu cuenta." /></Card>}
  </div>
}
