import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus } from '@phosphor-icons/react'
import { Button, ButtonLink, Card, EmptyState, PageHeading } from '../../components/ui'
import { useAuth } from '../../features/auth/AuthContext'
import { TicketAccess } from '../../features/tickets/TicketAccess'
import { TicketRow } from '../../features/tickets/TicketRow'
import { ticketApi } from '../../lib/api/tickets'

function OwnTickets() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [submitted, setSubmitted] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'resuelto'>('')
  const params = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (submitted) params.set('search', submitted)
  if (status) params.set('status', status)
  const listing = useQuery({ queryKey: ['tickets', user?.id, 'list', page, submitted, status], refetchInterval: 15000, queryFn: () => ticketApi.list(params), enabled: !!user })
  const summary = useQuery({ queryKey: ['tickets', user?.id, 'summary'], queryFn: ticketApi.summary, enabled: !!user })
  const services = useQuery({ queryKey: ['tickets', 'services'], queryFn: ticketApi.services, enabled: !!user })
  return <div className="content-stack tickets-view">
    <PageHeading title="Mis incidencias" subtitle="Consulta y da seguimiento a tus reportes de TI." action={<ButtonLink to="/incidencias/nueva"><Plus />Nueva incidencia</ButtonLink>} />
    <Card><form className="ticket-list__tools" onSubmit={event => { event.preventDefault(); setPage(1); setSubmitted(search.trim()) }}><label htmlFor="ticket-search">Buscar por código o descripción</label><input id="ticket-search" className="input" value={search} onChange={event => setSearch(event.target.value)} maxLength={100} placeholder="Código o descripción" /><Button type="submit" variant="secondary">Buscar</Button>{submitted && <Button variant="ghost" onClick={() => { setSearch(''); setSubmitted(''); setPage(1) }}>Limpiar</Button>}</form>
      <div className="ticket-list__status-filters" role="group" aria-label="Filtrar mis incidencias">{[
        { id: '' as const, label: 'Todas', count: summary.data?.total },
        { id: 'active' as const, label: 'Activas', count: summary.data ? summary.data.registered + summary.data.inAttention : undefined },
        { id: 'resuelto' as const, label: 'Resueltas', count: summary.data?.resolved },
      ].map(filter => <Button key={filter.id || 'all'} type="button" variant={status === filter.id ? 'primary' : 'ghost'} aria-pressed={status === filter.id} onClick={() => { setPage(1); setStatus(filter.id) }}>{filter.label}{filter.count === undefined ? '' : ` (${filter.count})`}</Button>)}</div>
      {summary.error && <p role="alert">No se pudieron consultar los conteos de tus incidencias. <Button variant="ghost" onClick={() => void summary.refetch()}>Reintentar</Button></p>}
      {listing.isPending ? <p role="status">Cargando incidencias…</p> : listing.error ? <p role="alert">No se pudieron cargar tus incidencias. <Button variant="ghost" onClick={() => void listing.refetch()}>Reintentar</Button></p> : listing.data?.items.length ? <><p className="body-muted">{listing.data.total} resultado(s) · página {page}</p><div className="ticket-list">{listing.data.items.map(ticket => <TicketRow key={ticket.id} ticket={ticket} services={services.data} />)}</div><div className="ticket-pages"><Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button><Button variant="secondary" disabled={page * 20 >= listing.data.total} onClick={() => setPage(page + 1)}>Siguiente</Button></div></> : <EmptyState title={submitted || status ? 'Sin incidencias en este filtro' : 'Aún no tienes incidencias'} description={submitted || status ? 'Prueba otro estado o término de búsqueda.' : 'Registra tu primer reporte para verlo aquí.'} action={!submitted && !status ? <ButtonLink to="/incidencias/nueva">Crear reporte</ButtonLink> : undefined} />}
    </Card>
  </div>
}
export default function IncidenciasPage() { return <TicketAccess permission="tickets:read:self"><OwnTickets /></TicketAccess> }
