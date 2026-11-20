import { useQuery } from '@tanstack/react-query'
import { CheckCircle, ClipboardText } from '@phosphor-icons/react'
import { useLocation } from 'react-router-dom'
import { ButtonLink, Card, Notice, PageHeading } from '../../../components/ui'
import { TicketAccess } from '../../../features/tickets/TicketAccess'
import { ticketApi, ticketDate } from '../../../lib/api/tickets'
import { statusLabels } from '../../../lib/api/workflow'

function Receipt() {
  const id = useLocation().pathname.split('/').pop() || ''
  const ticket = useQuery({ queryKey: ['tickets', 'detail', id], queryFn: () => ticketApi.get(id) })
  if (ticket.isPending) return <Card><p role="status">Consultando el reporte…</p></Card>
  if (ticket.error) return <Notice tone="amber" role="alert">No se pudo consultar el reporte. <ButtonLink to="/incidencias" variant="secondary">Mis incidencias</ButtonLink></Notice>
  return <div className="content-stack tickets-view ticket-receipt">
    <CheckCircle size={64} weight="duotone" aria-hidden="true" />
    <PageHeading title="Incidencia registrada" subtitle="Tu reporte tiene un código y seguimiento. TI evaluará su atención." illustration={false} />
    <strong className="ticket-receipt__code">Ticket: {ticket.data.code}</strong>
    <Card><h2>Estado actual</h2><div className="ticket-facts"><div><span>Registro</span><strong>{statusLabels[ticket.data.status]}</strong></div><div><span>Evaluación</span><strong>{ticket.data.classificationStatus==='manual'?'Evaluada por TI':'Pendiente'}</strong></div><div><span>Prioridad</span><strong>{ticket.data.priority??'Aún no calculada'}</strong></div><div><span>Recibido</span><strong>{ticketDate(ticket.data.createdAt)}</strong></div></div></Card>
    <Notice>TI revisará el reporte. Puedes consultar su estado en Mis incidencias.</Notice>
    <div className="ticket-receipt__actions"><ButtonLink to={`/incidencias/${ticket.data.id}`}><ClipboardText />Ver detalle</ButtonLink><ButtonLink to="/incidencias" variant="secondary">Mis incidencias</ButtonLink></div>
  </div>
}
export default function ReporteRecibidoPage() { return <TicketAccess permission="tickets:read:self"><Receipt /></TicketAccess> }
