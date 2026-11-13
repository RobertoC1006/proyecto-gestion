import type { components } from './schema'
import { request } from './http'

export type Ticket = components['schemas']['TicketDto']
export type TicketPage = components['schemas']['TicketPageDto']
export type TicketService = components['schemas']['TicketServiceDto']
export type CreateTicket = components['schemas']['CreateTicketDto']

export const ticketApi = {
  services: () => request<TicketService[]>('tickets/services'),
  list: (params: URLSearchParams) => request<TicketPage>(`tickets?${params}`),
  get: (id: string) => request<Ticket>(`tickets/${encodeURIComponent(id)}`),
  create: (body: CreateTicket, key: string) => request<Ticket>('tickets', {
    method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body),
  }),
}

export function ticketDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima',
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}
