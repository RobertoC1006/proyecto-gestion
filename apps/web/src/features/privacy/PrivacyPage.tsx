import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Funnel, LockKey, ShieldCheck, UserCircle } from '@phosphor-icons/react'
import { Button, Card, CardHeading, EmptyState, Field, Notice, PageHeading, Select } from '../../components/ui'
import { ApiError, request } from '../../lib/api/http'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { access, hasAccess } from '../auth/access'
import './privacy.css'

type Version = { id: string; version: string; title: string; summary: string; effectiveAt: string }
type Acceptance = { id: string; userId: string; displayName: string; version: string; acceptedAt: string }
type ConsentMe = { current: Version | null; acceptance: Acceptance | null }
type AuditItem = { id: string; occurredAt: string; actorId: string | null; actor: string; action: string; objectType: string; objectId: string | null; reason: string | null; before: Record<string, unknown> | null; after: Record<string, unknown> | null }
type AuditPage = { items: AuditItem[]; total: number; page: number; pageSize: number }

const formatDate = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const errorText = (error: unknown) => error instanceof Error ? error.message : 'No se pudo cargar la información.'

function ConsentPanel() {
  const client = useQueryClient()
  const consent = useQuery({ queryKey: ['consent', 'me'], queryFn: () => request<ConsentMe>('consent/me') })
  const [accepting, setAccepting] = useState(false)
  const [consentChecked, setConsentChecked] = useState(false)
  const [message, setMessage] = useState('')
  async function accept() {
    if (!current?.id || !consentChecked || accepting) return
    setAccepting(true)
    setMessage('')
    try { await request<Acceptance>('consent/accept', { method: 'POST', body: JSON.stringify({ expectedVersionId: current.id }) }); setMessage('Consentimiento registrado.'); setConsentChecked(false); await client.invalidateQueries({ queryKey: ['consent', 'me'] }) }
    catch (error) { setMessage(errorText(error)) }
    finally { setAccepting(false) }
  }
  if (consent.isPending) return <Card><p role="status">Cargando consentimiento…</p></Card>
  if (consent.error) return <Notice tone="amber" role="alert">{errorText(consent.error)}<Button variant="ghost" onClick={() => void consent.refetch()}>Reintentar</Button></Notice>
  const current = consent.data?.current
  const accepted = consent.data?.acceptance
  return <div className="privacy-grid">
    <Card>
      <CardHeading title="Consentimiento vigente" icon={ShieldCheck} />
      {message && <Notice tone={message.endsWith('.') && message.startsWith('Consentimiento') ? 'green' : 'amber'} role="status">{message}</Notice>}
      {!current ? <EmptyState title="No hay una versión vigente" description="Administración todavía no ha publicado una política de consentimiento." /> : <div className="consent-version">
        <div className="consent-version__icon"><ShieldCheck size={30} /></div>
        <div><h3>{current.title}</h3><p>{current.summary}</p><small>Versión {current.version} · Vigente desde {formatDate(current.effectiveAt)}</small></div>
      </div>}
      {current && (accepted ? <Notice icon={CheckCircle}><strong>Consentimiento aceptado</strong><p>Versión {accepted.version} · {formatDate(accepted.acceptedAt)}</p></Notice> : <div className="consent-action"><label className="consent-checkbox"><input type="checkbox" checked={consentChecked} onChange={event => setConsentChecked(event.target.checked)} />He leído y acepto explícitamente esta versión.</label><Button disabled={accepting || !consentChecked} onClick={() => void accept()}>{accepting ? 'Registrando…' : 'Aceptar consentimiento'}</Button></div>)}
    </Card>
    <Card>
      <CardHeading title="Protección de datos" icon={LockKey} />
      <ul className="privacy-list"><li>La aceptación se vincula a tu cuenta y a tu institución.</li><li>La fecha la registra el servidor en UTC.</li><li>La preparación analítica no elimina el historial operativo.</li></ul>
    </Card>
  </div>
}

function AuditPanel() {
  const [filters, setFilters] = useState({ from: '', to: '', actorId: '', action: '', objectType: '' })
  const [exportError, setExportError] = useState('')
  const [applied, setApplied] = useState(filters)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditItem | null>(null)
  const exportParams = new URLSearchParams()
  for (const [key, value] of Object.entries(applied)) {
    if (!value.trim()) continue
    exportParams.set(key, key === 'from' || key === 'to' ? new Date(value).toISOString() : value.trim())
  }
  const query = useQuery({ queryKey: ['audit', applied, page], queryFn: () => {
    const params = new URLSearchParams(exportParams)
    params.set('page', String(page))
    params.set('pageSize', '10')
    return request<AuditPage>(`audit?${params.toString()}`)
  } })
  function submit(event: React.FormEvent) {
    event.preventDefault()
    setPage(1)
    setApplied(filters)
    setSelected(null)
    setExportError('')
  }
  async function exportAudit() {
    setExportError('')
    const response = await fetch(`/api/v1/audit/export${exportParams.size ? `?${exportParams.toString()}` : ''}`, { credentials: 'same-origin', cache: 'no-store' })
    if (!response.ok) throw new Error('No se pudo exportar la auditoría.')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'campusitsm-auditoria.csv'
    link.click()
    URL.revokeObjectURL(url)
  }
  return <div className="audit-layout">
    <Card className="audit-filter-card"><CardHeading title="Filtros de auditoría" icon={Funnel} /><form className="audit-filters" onSubmit={submit}>
      <Field label="Desde"><input className="input" type="datetime-local" value={filters.from} onChange={event => setFilters({ ...filters, from: event.target.value })} /></Field>
      <Field label="Hasta"><input className="input" type="datetime-local" value={filters.to} onChange={event => setFilters({ ...filters, to: event.target.value })} /></Field>
      <Field label="ID del actor"><input className="input" value={filters.actorId} onChange={event => setFilters({ ...filters, actorId: event.target.value })} /></Field>
      <Field label="Acción"><Select value={filters.action} onChange={event => setFilters({ ...filters, action: event.target.value })}><option value="">Todas</option><option value="consent.accept">Aceptar consentimiento</option><option value="access.change">Cambio de acceso</option><option value="permissions.change">Cambio de permisos</option><option value="certificate.issue">Emitir constancia</option><option value="certificate.verify">Verificar PDF</option><option value="certificate.download">Descargar PDF</option><option value="certificate.lookup">Consultar código</option><option value="ticket.ai.classify">Clasificación automática</option><option value="ticket.ai.fallback">Revisión manual de IA</option><option value="ticket.reclassify">Corregir servicio</option><option value="ticket.assign">Asignar responsable</option><option value="ticket.evaluate">Evaluar prioridad</option><option value="ticket.resolve">Resolver ticket</option><option value="ticket.start">Atender ticket</option><option value="create">Crear</option><option value="update">Actualizar</option></Select></Field>
      <Field label="Objeto"><Select value={filters.objectType} onChange={event => setFilters({ ...filters, objectType: event.target.value })}><option value="">Todos</option><option value="ConsentVersion">Consentimiento</option><option value="AppUser">Usuario</option><option value="RoleAccess">Permisos</option><option value="AcademicEvent">Evento académico</option><option value="Ticket">Incidencia</option><option value="Certificate">Constancia</option></Select></Field>
      <Button type="submit" icon={Funnel}>Filtrar</Button>
    </form></Card>
    {query.isPending ? <Card><p role="status">Cargando auditoría…</p></Card> : query.error ? <Notice tone="amber" role="alert">{query.error instanceof ApiError && query.error.status === 403 ? 'No tienes permiso para consultar la auditoría.' : errorText(query.error)}<Button variant="ghost" onClick={() => void query.refetch()}>Reintentar</Button></Notice> : <Card className="audit-results">
      <CardHeading title="Resultados de la auditoría" action={<span className="privacy-count">{query.data?.total ?? 0} registros</span>} />
      {!query.data?.items.length ? <EmptyState title="No hay registros" description="Prueba con otros filtros o limpia la consulta." /> : <div className="audit-table-wrap"><table className="audit-table"><thead><tr><th>Fecha y hora</th><th>Actor</th><th>Acción</th><th>Objeto</th></tr></thead><tbody>{query.data.items.map(item => <tr key={`${item.id}:${item.action}`} tabIndex={0} role="button" aria-label={`Ver auditoría ${item.action} de ${item.actor}`} aria-selected={selected?.id === item.id && selected.action === item.action} className={selected?.id === item.id && selected.action === item.action ? 'is-selected' : ''} onClick={() => setSelected(item)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(item) } }}><td>{formatDate(item.occurredAt)}</td><td><UserCircle size={18} />{item.actor}</td><td>{item.action}</td><td>{item.objectType}</td></tr>)}</tbody></table></div>}
      {exportError && <Notice tone="amber" role="alert">{exportError}</Notice>}
      <div className="button-row"><Button variant="secondary" onClick={() => void exportAudit().catch(() => setExportError('No se pudo exportar la auditoría.'))}>Exportar CSV autorizado</Button></div>
      <div className="audit-pagination"><span>Página {page} de {Math.max(1, Math.ceil((query.data?.total ?? 0) / 10))}</span><div><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</Button><Button variant="secondary" disabled={!query.data || page >= Math.ceil(query.data.total / 10)} onClick={() => setPage(value => value + 1)}>Siguiente</Button></div></div>
    </Card>}
    {selected && <Card className="audit-detail"><CardHeading title="Detalle del registro" /><dl><dt>Actor</dt><dd>{selected.actor}</dd><dt>Fecha y hora</dt><dd>{formatDate(selected.occurredAt)}</dd><dt>Acción</dt><dd>{selected.action}</dd><dt>Objeto</dt><dd>{selected.objectType}{selected.objectId ? ` · ${selected.objectId}` : ''}</dd></dl><div className="audit-change"><strong>Cambios</strong><div><pre>{JSON.stringify(selected.before, null, 2) || '—'}</pre><span>→</span><pre>{JSON.stringify(selected.after, null, 2) || '—'}</pre></div></div>{selected.reason && <p><strong>Justificación</strong><br />{selected.reason}</p>}</Card>}
  </div>
}

export default function PrivacyPage({ audit = false }: { audit?: boolean }) {
  const { user } = useAuth()
  return <div className="content-stack privacy-page">
    <PageHeading title={audit ? 'Auditoría institucional' : 'Privacidad y consentimiento'}
      subtitle={audit ? 'Consulta los cambios autorizados de la institución.' : 'Revisa la política vigente y el estado de tu consentimiento.'}
      illustration={false} />
    {hasAccess(user, access.audit) && <div className="privacy-tabs">
      <Link to="/admin/privacidad" className={!audit ? 'is-active' : ''}>Consentimientos</Link>
      <Link to="/admin/auditoria" className={audit ? 'is-active' : ''}>Auditoría</Link>
    </div>}
    {audit ? <AuditPanel /> : <ConsentPanel />}
  </div>
}
