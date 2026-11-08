import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from '@phosphor-icons/react'
import { Link, useLocation } from 'react-router-dom'
import { Card, Notice, PageHeading } from '../../../components/ui'
import { TicketAccess } from '../../../features/tickets/TicketAccess'
import { ticketApi, ticketDate } from '../../../lib/api/tickets'
import { ApiError } from '../../../lib/api/http'

function OwnTicketDetail() {
  const id = useLocation().pathname.split('/').pop() || ''
  const ticket = useQuery({ queryKey: ['tickets', 'detail', id], queryFn: () => ticketApi.get(id) })
  const services = useQuery({ queryKey: ['tickets', 'services'], queryFn: ticketApi.services })
  if (ticket.isPending) return <Card><p role="status">Cargando incidencia…</p></Card>
  if (ticket.error) return <Notice tone="amber" role="alert">{ticket.error instanceof ApiError && ticket.error.status === 404 ? 'La incidencia no existe o no está disponible para tu cuenta.' : 'No se pudo consultar la incidencia.'}</Notice>
  const service = services.data?.find(item => item.id === ticket.data.service)?.label || ticket.data.service.replace(/_/g, ' ')
  return <div className="content-stack tickets-view"><Link className="tickets-back" to="/incidencias"><ArrowLeft size={17} />Mis incidencias</Link>
    <PageHeading title={`Incidencia ${ticket.data.code}`} subtitle="Consulta el estado actual de tu reporte." />
    <div className="ticket-form-layout"><Card><h2>Detalle de la incidencia</h2><p className="ticket-description">{ticket.data.description}</p><div className="ticket-facts"><div><span>Servicio afectado</span><strong>{service}</strong></div><div><span>Alcance</span><strong>{ticket.data.scope === 'general' ? 'General' : 'Curso'}</strong></div><div><span>Registrada</span><strong>{ticketDate(ticket.data.createdAt)}</strong></div><div><span>Última actualización</span><strong>{ticketDate(ticket.data.updatedAt)}</strong></div></div></Card><Card><h2>Progreso</h2><ol className="ticket-steps"><li><strong>Registrado</strong><small>El reporte fue recibido.</small></li><li><strong>Clasificación pendiente</strong><small>Aún no se ha clasificado ni calculado la prioridad.</small></li></ol></Card></div>
  </div>
}
export default function IncidenciaDetailPage() { return <TicketAccess permission="tickets:read:self"><OwnTicketDetail /></TicketAccess> }
