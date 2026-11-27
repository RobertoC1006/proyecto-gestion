import type { components } from './schema'
import { ApiError, request } from './http'

export type Ticket = components['schemas']['TicketDto']
export type TicketPage = components['schemas']['TicketPageDto']
export type TicketSummary = components['schemas']['TicketSummaryDto']
export type TicketService = components['schemas']['TicketServiceDto']
export type CreateTicket = components['schemas']['CreateTicketDto']
export type TicketAttachment = { id: string; ticketId: string; originalName: string; mimeType: string;
  sizeBytes: number; sha256: string; createdAt: string }

export async function evidenceBody(file: File) {
  if (!file.size || file.size > 5_242_880) throw new Error('Selecciona un archivo de 1 byte a 5 MiB.')
  if (!['image/png', 'image/jpeg', 'application/pdf'].includes(file.type)) throw new Error('Selecciona un PNG, JPG o PDF.')
  const contentBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.readAsDataURL(file)
  })
  return { originalName: file.name, mimeType: file.type, contentBase64 }
}

export async function downloadEvidence(id: string, filename: string) {
  const response = await fetch(`/api/v1/tickets/${encodeURIComponent(id)}/attachment/content`, { credentials: 'same-origin', cache: 'no-store' })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new ApiError(response.status, error.code ?? 'REQUEST_FAILED', error.message ?? 'No se pudo descargar la evidencia.')
  }
  const url = URL.createObjectURL(await response.blob())
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.append(link)
    link.click()
    link.remove()
  } finally { window.setTimeout(() => URL.revokeObjectURL(url), 1000) }
}

export const ticketApi = {
  services: () => request<TicketService[]>('tickets/services'),
  attachmentStatus: () => request<{ configured: boolean }>('tickets/attachment-status'),
  summary: () => request<TicketSummary>('tickets/summary'),
  list: (params: URLSearchParams) => request<TicketPage>(`tickets?${params}`),
  get: (id: string) => request<Ticket>(`tickets/${encodeURIComponent(id)}`),
  create: (body: CreateTicket, key: string) => request<Ticket>('tickets', {
    method: 'POST', headers: { 'Idempotency-Key': key }, body: JSON.stringify(body),
  }),
  attachment: (id: string) => request<TicketAttachment>(`tickets/${encodeURIComponent(id)}/attachment`),
  attach: async (id: string, file: File) => request<TicketAttachment>(`tickets/${encodeURIComponent(id)}/attachment`, {
    method: 'PUT', body: JSON.stringify(await evidenceBody(file)),
  }),
}

export function ticketDate(value: string) {
  return new Intl.DateTimeFormat('es-PE', { timeZone: 'America/Lima',
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export const ticketServices = [
  ['aula_virtual', 'Aula virtual'],
  ['wifi_red', 'Wi-Fi/red'],
  ['correo', 'Correo institucional'],
  ['equipos', 'Equipo de cómputo'],
  ['impresoras', 'Impresora'],
  ['cuentas_accesos', 'Cuentas y accesos'],
  ['videoconferencia', 'Videoconferencia'],
  ['sistemas_institucionales', 'Sistemas institucionales'],
  ['almacenamiento_nube', 'Almacenamiento/nube'],
  ['software_licencias', 'Software/licencias'],
  ['otro', 'Otro'],
] as const
export function ticketServiceLabel(service: string) {
  return ticketServices.find(([value]) => value === service)?.[1] ?? service
}
