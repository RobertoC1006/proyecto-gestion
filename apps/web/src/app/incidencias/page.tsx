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
  const params = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (submitted) params.set('search', submitted)
  const listing = useQuery({ queryKey: ['tickets', user?.id, 'list', page, submitted], queryFn: () => ticketApi.list(params), enabled: !!user })
  const services = useQuery({ queryKey: ['tickets', 'services'], queryFn: ticketApi.services, enabled: !!user })
  return <div className="content-stack tickets-view">
    <PageHeading title="Mis incidencias" subtitle="Consulta y da seguimiento a tus reportes de TI." action={<ButtonLink to="/incidencias/nueva"><Plus />Nueva incidencia</ButtonLink>} />
    <Card><form className="ticket-list__tools" onSubmit={event => { event.preventDefault(); setPage(1); setSubmitted(search.trim()) }}><label htmlFor="ticket-search">Buscar por código o descripción</label><input id="ticket-search" className="input" value={search} onChange={event => setSearch(event.target.value)} maxLength={100} placeholder="Código o descripción" /><Button type="submit" variant="secondary">Buscar</Button>{submitted && <Button variant="ghost" onClick={() => { setSearch(''); setSubmitted(''); setPage(1) }}>Limpiar</Button>}</form>
      {listing.isPending ? <p role="status">Cargando incidencias…</p> : listing.error ? <p role="alert">No se pudieron cargar tus incidencias. <Button variant="ghost" onClick={() => void listing.refetch()}>Reintentar</Button></p> : listing.data?.items.length ? <><p className="body-muted">{listing.data.total} resultado(s) · página {page}</p><div className="ticket-list">{listing.data.items.map(ticket => <TicketRow key={ticket.id} ticket={ticket} services={services.data} />)}</div><div className="ticket-pages"><Button variant="secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</Button><Button variant="secondary" disabled={page * 20 >= listing.data.total} onClick={() => setPage(page + 1)}>Siguiente</Button></div></> : <EmptyState title={submitted ? 'Sin coincidencias' : 'Aún no tienes incidencias'} description={submitted ? 'Prueba otro código o texto.' : 'Registra tu primer reporte para verlo aquí.'} action={!submitted ? <ButtonLink to="/incidencias/nueva">Crear reporte</ButtonLink> : undefined} />}
    </Card>
  </div>
}
export default function IncidenciasPage() { return <TicketAccess permission="tickets:read:self"><OwnTickets /></TicketAccess> }
