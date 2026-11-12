import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Funnel, LockKey, ShieldCheck, UserCircle } from '@phosphor-icons/react'
import { Button, Card, CardHeading, EmptyState, Field, Notice, PageHeading, Select } from '../../components/ui'
import { ApiError, request } from '../../lib/api/http'
import './privacy.css'

type Version = { id: string; version: string; title: string; summary: string; effectiveAt: string }
type Acceptance = { id: string; userId: string; displayName: string; version: string; acceptedAt: string }
type ConsentMe = { current: Version | null; acceptance: Acceptance | null }
type AuditItem = { id: string; occurredAt: string; actorId: string; actor: string; action: string; objectType: string; objectId: string | null; reason: string | null; before: Record<string, unknown> | null; after: Record<string, unknown> | null }
type AuditPage = { items: AuditItem[]; total: number; page: number; pageSize: number }

const formatDate = (value: string) => new Intl.DateTimeFormat('es-PE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
const errorText = (error: unknown) => error instanceof Error ? error.message : 'No se pudo cargar la información.'

function ConsentPanel() {
  const client = useQueryClient()
  const consent = useQuery({ queryKey: ['consent', 'me'], queryFn: () => request<ConsentMe>('consent/me') })
  const [accepting, setAccepting] = useState(false)
  const [message, setMessage] = useState('')
  async function accept() {
    setAccepting(true); setMessage('')
    try { await request<Acceptance>('consent/accept', { method: 'POST', body: '{}' }); setMessage('Consentimiento registrado.'); await client.invalidateQueries({ queryKey: ['consent', 'me'] }) }
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
      {current && (accepted ? <Notice icon={CheckCircle}><strong>Consentimiento aceptado</strong><p>Versión {accepted.version} · {formatDate(accepted.acceptedAt)}</p></Notice> : <div className="consent-action"><p>Lee la política vigente y confirma de forma explícita para continuar.</p><Button disabled={accepting} onClick={() => void accept()}>{accepting ? 'Registrando…' : 'Aceptar consentimiento'}</Button></div>)}
    </Card>
    <Card>
      <CardHeading title="Protección de datos" icon={LockKey} />
      <ul className="privacy-list"><li>La aceptación se vincula a tu cuenta y a tu institución.</li><li>La fecha la registra el servidor en UTC.</li><li>La preparación analítica no elimina el historial operativo.</li></ul>
    </Card>
  </div>
}

function AuditPanel() {
  const [filters, setFilters] = useState({ from: '', to: '', action: '', objectType: '' })
  const [applied, setApplied] = useState(filters)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<AuditItem | null>(null)
  const query = useQuery({ queryKey: ['audit', applied, page], queryFn: () => {
    const params = new URLSearchParams({ page: String(page), pageSize: '10' })
    Object.entries(applied).forEach(([key, value]) => { if (value) params.set(key, key === 'from' || key === 'to' ? new Date(value).toISOString() : value) })
    return request<AuditPage>(`audit?${params.toString()}`)
  } })
  function submit(event: React.FormEvent) { event.preventDefault(); setPage(1); setApplied(filters); setSelected(null) }
  return <div className="audit-layout">
    <Card className="audit-filter-card"><CardHeading title="Filtros de auditoría" icon={Funnel} /><form className="audit-filters" onSubmit={submit}>
      <Field label="Desde"><input className="input" type="datetime-local" value={filters.from} onChange={event => setFilters({ ...filters, from: event.target.value ? new Date(event.target.value).toISOString() : '' })} /></Field>
      <Field label="Hasta"><input className="input" type="datetime-local" value={filters.to ? filters.to.slice(0, 16) : ''} onChange={event => setFilters({ ...filters, to: event.target.value ? new Date(event.target.value).toISOString() : '' })} /></Field>
      <Field label="Acción"><Select value={filters.action} onChange={event => setFilters({ ...filters, action: event.target.value })}><option value="">Todas</option><option value="consent.accept">Aceptar consentimiento</option><option value="access.change">Cambio de acceso</option><option value="permissions.change">Cambio de permisos</option><option value="create">Crear</option><option value="update">Actualizar</option></Select></Field>
      <Field label="Objeto"><Select value={filters.objectType} onChange={event => setFilters({ ...filters, objectType: event.target.value })}><option value="">Todos</option><option value="ConsentVersion">Consentimiento</option><option value="AppUser">Usuario</option><option value="RoleAccess">Permisos</option><option value="AcademicEvent">Evento académico</option></Select></Field>
      <Button type="submit" icon={Funnel}>Filtrar</Button>
    </form></Card>
    {query.isPending ? <Card><p role="status">Cargando auditoría…</p></Card> : query.error ? <Notice tone="amber" role="alert">{query.error instanceof ApiError && query.error.status === 403 ? 'No tienes permiso para consultar la auditoría.' : errorText(query.error)}<Button variant="ghost" onClick={() => void query.refetch()}>Reintentar</Button></Notice> : <Card className="audit-results">
      <CardHeading title="Resultados de la auditoría" action={<span className="privacy-count">{query.data?.total ?? 0} registros</span>} />
      {!query.data?.items.length ? <EmptyState title="No hay registros" description="Prueba con otros filtros o limpia la consulta." /> : <div className="audit-table-wrap"><table className="audit-table"><thead><tr><th>Fecha y hora</th><th>Actor</th><th>Acción</th><th>Objeto</th></tr></thead><tbody>{query.data.items.map(item => <tr key={item.id} tabIndex={0} role="button" aria-label={`Ver auditoría ${item.action} de ${item.actor}`} aria-selected={selected?.id === item.id} className={selected?.id === item.id ? 'is-selected' : ''} onClick={() => setSelected(item)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelected(item) } }}><td>{formatDate(item.occurredAt)}</td><td><UserCircle size={18} />{item.actor}</td><td>{item.action}</td><td>{item.objectType}</td></tr>)}</tbody></table></div>}
      <div className="audit-pagination"><span>Página {page} de {Math.max(1, Math.ceil((query.data?.total ?? 0) / 10))}</span><div><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</Button><Button variant="secondary" disabled={!query.data || page >= Math.ceil(query.data.total / 10)} onClick={() => setPage(value => value + 1)}>Siguiente</Button></div></div>
    </Card>}
    {selected && <Card className="audit-detail"><CardHeading title="Detalle del registro" /><dl><dt>Actor</dt><dd>{selected.actor}</dd><dt>Fecha y hora</dt><dd>{formatDate(selected.occurredAt)}</dd><dt>Acción</dt><dd>{selected.action}</dd><dt>Objeto</dt><dd>{selected.objectType}{selected.objectId ? ` · ${selected.objectId}` : ''}</dd></dl><div className="audit-change"><strong>Cambios</strong><div><pre>{JSON.stringify(selected.before, null, 2) || '—'}</pre><span>→</span><pre>{JSON.stringify(selected.after, null, 2) || '—'}</pre></div></div>{selected.reason && <p><strong>Justificación</strong><br />{selected.reason}</p>}</Card>}
  </div>
}

export default function PrivacyPage() {
  const [tab, setTab] = useState<'consent' | 'audit'>('consent')
  return <div className="content-stack privacy-page"><PageHeading title="Consentimientos y auditoría" subtitle="Gestiona el consentimiento y consulta los cambios autorizados de la institución." illustration={false} /><div className="privacy-tabs" role="tablist"><button className={tab === 'consent' ? 'is-active' : ''} role="tab" aria-selected={tab === 'consent'} onClick={() => setTab('consent')}>Consentimientos</button><button className={tab === 'audit' ? 'is-active' : ''} role="tab" aria-selected={tab === 'audit'} onClick={() => setTab('audit')}>Auditoría</button></div>{tab === 'consent' ? <ConsentPanel /> : <AuditPanel />}</div>
}
