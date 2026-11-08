import { useRef, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, PaperPlaneTilt } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Field, FormError, Notice, PageHeading, Select } from '../../../components/ui'
import { TicketAccess } from '../../../features/tickets/TicketAccess'
import { ApiError } from '../../../lib/api/http'
import { ticketApi, type CreateTicket } from '../../../lib/api/tickets'

function ReportForm() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const services = useQuery({ queryKey: ['tickets', 'services'], queryFn: ticketApi.services })
  const [description, setDescription] = useState('')
  const [service, setService] = useState<CreateTicket['service'] | ''>('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const key = useRef<string | null>(null)
  const change = () => { key.current = null; setError('') }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (sending) return
    if (description.trim().length < 20 || description.trim().length > 5000) { setError('Describe el problema con entre 20 y 5000 caracteres.'); return }
    if (!service) { setError('Selecciona el servicio afectado.'); return }
    key.current ||= crypto.randomUUID()
    setSending(true); setError('')
    try {
      const ticket = await ticketApi.create({ description: description.trim(), service, scope: 'general', courseId: null, sectionId: null }, key.current)
      await client.invalidateQueries({ queryKey: ['tickets'] })
      navigate(`/incidencias/registrada/${ticket.id}`)
    } catch (cause) {
      setError(cause instanceof ApiError && cause.fields && Object.values(cause.fields).length ? Object.values(cause.fields).join(' ') : cause instanceof Error ? cause.message : 'No se pudo enviar. Inténtalo de nuevo.')
    } finally { setSending(false) }
  }
  return <div className="content-stack tickets-view">
    <Link className="tickets-back" to="/incidencias"><ArrowLeft size={17} />Mis incidencias</Link>
    <PageHeading title="Reportar una incidencia" subtitle="Describe el problema para que TI pueda revisarlo." />
    <div className="ticket-form-layout"><Card><form onSubmit={event => void submit(event)} noValidate><h2>Información de la incidencia</h2>
      <Field label="Descripción del problema" required><textarea className="input" value={description} minLength={20} maxLength={5000} onChange={event => { change(); setDescription(event.target.value) }} placeholder="Explica qué ocurre y desde cuándo…" /></Field>
      <Field label="Servicio afectado" required><Select value={service} onChange={event => { change(); setService(event.target.value as CreateTicket['service']) }} disabled={services.isPending || !!services.error}><option value="">Selecciona un servicio</option>{services.data?.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></Field>
      {services.error && <Notice tone="amber" role="alert">No se pudo cargar la lista de servicios. <Button variant="ghost" onClick={() => void services.refetch()}>Reintentar</Button></Notice>}
      <Field label="Alcance del reporte" required><Select value="general" disabled><option value="general">General</option></Select></Field>
      <Notice tone="amber">Por ahora puedes registrar incidencias generales. La selección de cursos y los archivos adjuntos estarán disponibles más adelante.</Notice>
      <FormError message={error} />
      <div className="ticket-form-actions"><Button type="submit" icon={PaperPlaneTilt} disabled={sending || services.isPending || !!services.error}>{sending ? 'Enviando…' : 'Enviar incidencia'}</Button></div>
    </form></Card><Card><h2>¿Qué sucede después?</h2><ol className="ticket-steps"><li>Recibimos tu reporte y te damos un código.</li><li>La clasificación queda pendiente hasta que se realice.</li><li>Puedes consultar el estado en Mis incidencias.</li></ol></Card></div>
  </div>
}
export default function NuevaIncidenciaPage() { return <TicketAccess permission="tickets:create"><ReportForm /></TicketAccess> }
