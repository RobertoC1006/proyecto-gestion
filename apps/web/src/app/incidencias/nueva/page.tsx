import { api } from '../../../lib/api/academic'
import type { Context } from '../../../lib/api/workflow'
import '../../../features/tickets/workflow.css'
import { useRef, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, PaperPlaneTilt } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, Field, FormError, Notice, PageHeading, Select } from '../../../components/ui'
import { TicketAccess } from '../../../features/tickets/TicketAccess'
import { useAuth } from '../../../features/auth/AuthContext'
import { ApiError } from '../../../lib/api/http'
import { ticketApi, type CreateTicket, type Ticket } from '../../../lib/api/tickets'
import { allPages, type Course, type Section } from '../../../lib/api/academic'

function ReportForm() {
  const navigate = useNavigate()
  const client = useQueryClient()
  const { user } = useAuth()
  const [description, setDescription] = useState('')
  const [service, setService] = useState<CreateTicket['service'] | ''>('')
  const [scope, setScope] = useState<CreateTicket['scope']>(new URLSearchParams(location.search).has('courseId') ? 'curso' : 'general')
  const [courseId, setCourseId] = useState(new URLSearchParams(location.search).get('courseId')??'')
  const [sectionId, setSectionId] = useState(new URLSearchParams(location.search).get('sectionId')??'')
  const services = useQuery({ queryKey: ['tickets', 'services'], queryFn: ticketApi.services })
  const attachmentStatus = useQuery({ queryKey: ['tickets', 'attachment-status'], queryFn: ticketApi.attachmentStatus })
  const courses = useQuery({ queryKey: ['academic', user?.id, 'my-courses'], queryFn: () => allPages<Course>('me/courses'), enabled: !!user && scope === 'curso' })
  const sections = useQuery({ queryKey: ['academic', user?.id, 'my-sections', courseId], queryFn: () => allPages<Section>(`me/sections?courseId=${encodeURIComponent(courseId)}`), enabled: !!user && scope === 'curso' && !!courseId })
  const context = useQuery({queryKey:['academic',user?.id,'context',scope,courseId,sectionId],queryFn:()=>api<Context>(`me/context?${new URLSearchParams(scope==='curso'?{courseId,...(sectionId?{sectionId}:{})}:{})}`),enabled:!!user&&(scope==='general'||!!courseId)})
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [evidence, setEvidence] = useState<File | null>(null)
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null)
  const key = useRef<string | null>(null)
  const change = () => { key.current = null; setError('') }
  async function retryEvidence() {
    if (!createdTicket || !evidence || sending) return
    setSending(true); setError('')
    try {
      await ticketApi.attach(createdTicket.id, evidence)
      navigate(`/incidencias/registrada/${createdTicket.id}`)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo adjuntar. El reporte sigue registrado.')
    } finally { setSending(false) }
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (sending) return
    if (description.trim().length < 20 || description.trim().length > 5000) { setError('Describe el problema con entre 20 y 5000 caracteres.'); return }
    if (!service) { setError('Selecciona el servicio afectado.'); return }
    if (scope === 'curso' && (!courseId || courses.isError || !courses.data?.some(course => course.id === courseId))) { setError('Selecciona uno de tus cursos disponibles.'); return }
    if (evidence && (!evidence.size || evidence.size > 5_242_880 || !['image/png', 'image/jpeg', 'application/pdf'].includes(evidence.type))) { setError('La evidencia debe ser PNG, JPG o PDF y tener entre 1 byte y 5 MiB.'); return }
    key.current ||= crypto.randomUUID()
    setSending(true); setError('')
    try {
      const ticket = await ticketApi.create({ description: description.trim(), service, scope, courseId: scope === 'curso' ? courseId : null, sectionId: scope === 'curso' && sectionId ? sectionId : null }, key.current)
      setCreatedTicket(ticket)
      await client.invalidateQueries({ queryKey: ['tickets'] })
      if (evidence) {
        try { await ticketApi.attach(ticket.id, evidence) }
        catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo adjuntar. El reporte sigue registrado.'); return }
      }
      navigate(`/incidencias/registrada/${ticket.id}`)
    } catch (cause) {
      setError(cause instanceof ApiError && cause.fields && Object.values(cause.fields).length ? Object.values(cause.fields).join(' ') : cause instanceof Error ? cause.message : 'No se pudo enviar. Inténtalo de nuevo.')
    } finally { setSending(false) }
  }
  if (createdTicket) return <div className="content-stack tickets-view workflow-page">
    <PageHeading title="Reporte registrado" subtitle={`Tu código es ${createdTicket.code}. La evidencia se guarda por separado.`} />
    <Card><h2>Evidencia pendiente</h2><p>El reporte ya está guardado. Puedes reintentar la carga sin crear otro ticket.</p>
      <Field label="Archivo PNG, JPG o PDF" hint="Máximo 5 MiB"><input className="input" type="file" accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf" onChange={event => setEvidence(event.target.files?.[0] ?? null)} /></Field>
      <FormError message={error} /><div className="ticket-form-actions"><Button disabled={!evidence || sending} onClick={() => void retryEvidence()}>{sending ? 'Adjuntando…' : 'Reintentar evidencia'}</Button><Link to={`/incidencias/registrada/${createdTicket.id}`}>Continuar sin evidencia</Link></div>
    </Card></div>
  return <div className="content-stack tickets-view workflow-page">
    <Link className="tickets-back" to="/incidencias"><ArrowLeft size={17} />Mis incidencias</Link>
    <PageHeading title="Reportar una incidencia" subtitle="Describe el problema para que TI pueda revisarlo." />
    <div className="ticket-form-layout"><Card><form onSubmit={event => void submit(event)} noValidate><h2>Información de la incidencia</h2>
      <Field label="Descripción del problema" required hint={`${description.trim().length}/5000 caracteres · Mínimo 20`}><textarea className="input" value={description} minLength={20} maxLength={5000} onChange={event => { change(); setDescription(event.target.value) }} placeholder="¿Qué intentabas hacer? ¿Qué error apareció y desde cuándo ocurre?" /></Field>
      <Field label="Servicio afectado" required><Select value={service} onChange={event => { change(); setService(event.target.value as CreateTicket['service']) }} disabled={services.isPending || !!services.error}><option value="">Selecciona un servicio</option>{services.data?.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</Select></Field>
      {services.error && <Notice tone="amber" role="alert">No se pudo cargar la lista de servicios. <Button variant="ghost" onClick={() => void services.refetch()}>Reintentar</Button></Notice>}
      <div><p className="field__label">¿Con qué se relaciona el problema?</p><div className="workflow-scope">{[['general','Problema general','Servicios y accesos de la universidad'],['curso','Un curso o actividad','Examen, entrega o actividad de mi curso']].map(([v,label,hint])=><button type="button" key={v} aria-pressed={scope===v} onClick={()=>{change();setScope(v as CreateTicket['scope']);setCourseId('');setSectionId('')}}><strong>{label}</strong><small>{hint}</small></button>)}</div></div>
      {courses.isError && <Notice tone="amber" role="alert">No se pudieron consultar tus asociaciones académicas. Puedes continuar con un reporte General. <Button variant="ghost" onClick={() => void courses.refetch()}>Reintentar</Button></Notice>}
      {!courses.isError && courses.isSuccess && courses.data.length === 0 && <Notice tone="amber">No tienes asociaciones académicas disponibles. Puedes enviar un reporte General.</Notice>}
      {scope === 'curso' && <>
        <Field label="Curso" required><Select value={courseId} onChange={event => { change(); setSectionId(''); setCourseId(event.target.value) }} disabled={courses.isPending || !courses.data?.length}><option value="">Selecciona un curso</option>{courses.data?.map(course => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</Select></Field>
        {sections.error && <Notice tone="amber" role="alert">No se pudieron cargar las secciones de este curso. El curso sigue seleccionado. <Button variant="ghost" onClick={() => void sections.refetch()}>Reintentar</Button></Notice>}
        {courseId && sections.isSuccess && sections.data.length === 0 && <Notice>No tienes secciones asociadas a este curso; puedes continuar sin seleccionar sección.</Notice>}
        <Field label="Sección" hint="Opcional"><Select value={sectionId} onChange={event => { change(); setSectionId(event.target.value) }} disabled={!courseId || sections.isPending || !!sections.error}><option value="">Sin sección específica</option>{sections.data?.map(section => <option key={section.id} value={section.id}>{section.code} · {section.name}</option>)}</Select></Field>
      </>}
      {attachmentStatus.data?.configured ? <Field label="Evidencia opcional" hint="Un PNG, JPG o PDF de hasta 5 MiB. El reporte se registra primero."><input className="input" type="file" accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf" onChange={event => { setError(''); setEvidence(event.target.files?.[0] ?? null) }} /></Field> : <Notice tone="amber">El almacenamiento privado de evidencias aún no está habilitado. Puedes registrar el reporte sin archivo.</Notice>}
      <FormError message={error} />
      <div className="ticket-form-actions"><Button type="submit" icon={PaperPlaneTilt} disabled={sending || services.isPending || !!services.error}>{sending ? 'Enviando…' : 'Enviar incidencia'}</Button></div>
    </form></Card><Card><span className="workflow-eyebrow">TU CONTEXTO ACADÉMICO</span><h2>{context.data?.event?'Actividad relacionada':'Tu reporte tendrá seguimiento'}</h2>{context.error&&<Notice tone="amber" role="alert">No se pudo consultar el contexto. TI podrá revisarlo al evaluar tu reporte.</Notice>}{context.data?.event&&<div className="workflow-context-banner"><div><strong>{context.data.event.title}</strong><p>{new Date(context.data.event.startsAt).toLocaleString('es-PE',{timeZone:'America/Lima'})}</p><small>Esta actividad será considerada en la evaluación de TI.</small></div></div>}<h3>¿Qué sucede después?</h3><ol className="ticket-steps"><li>Recibimos tu reporte y te damos un código.</li><li>TI evalúa el problema y su contexto académico.</li><li>Puedes consultar la atención y la solución en Mis incidencias.</li></ol></Card></div>
  </div>
}
export default function NuevaIncidenciaPage() { return <TicketAccess permission="tickets:create"><ReportForm /></TicketAccess> }
