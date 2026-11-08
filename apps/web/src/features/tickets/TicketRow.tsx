import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import type { Ticket, TicketService } from '../../lib/api/tickets'
import { ticketDate } from '../../lib/api/tickets'

export function TicketRow({ ticket, services }: { ticket: Ticket; services?: TicketService[] }) {
  const service = services?.find(item => item.id === ticket.service)?.label || ticket.service.replace(/_/g, ' ')
  return <Link className="ticket-list__row" to={`/incidencias/${ticket.id}`}>
    <strong>{ticket.code}</strong>
    <span><b>{service}</b><small>{ticket.description}</small></span>
    <span className="ticket-state">Registrado · clasificación pendiente</span>
    <time dateTime={ticket.updatedAt}>{ticketDate(ticket.updatedAt)}</time>
    <ArrowRight size={18} aria-hidden="true" />
  </Link>
}
