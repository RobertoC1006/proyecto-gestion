import { useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChartLine, Download, Funnel, Info } from '@phosphor-icons/react'
import { Button, Card, EmptyState, Field, Notice, PageHeading, Select } from '../../components/ui'
import { request } from '../../lib/api/http'
import './reports.css'

type ReportSeries = { period: string; observed: number; forecast: number | null }
type ReportCategory = { service: string; label: string; count: number; percentage: number | null }
type ReportsData = {
  series: ReportSeries[]
  categories: ReportCategory[]
  total: number
  registered: number
  inAttention: number
  resolved: number
  resolutionRate: number | null
  resolvedWithinSlaRate: number | null
  source: 'tickets-operational'
  synthetic: boolean
  forecastStatus: 'unavailable'
  forecastMessage: string
  filters: { from: string; to: string; period: 'day' | 'week' | 'month'; scope: 'institution' | 'team' }
}

const toInputDate = (value: Date) => value.toISOString().slice(0, 10)
const ticketServices = [
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

export default function ReportsPage() {
  const now = new Date()
  const [draft, setDraft] = useState({
    from: toInputDate(new Date(now.getTime() - 42 * 86400000)),
    to: toInputDate(now),
    period: 'week' as 'day' | 'week' | 'month',
    service: '',
    status: '',
  })
  const [applied, setApplied] = useState(draft)

  const params = useMemo(() => {
    const value = new URLSearchParams()
    value.set('from', new Date(`${applied.from}T00:00:00.000Z`).toISOString())
    value.set('to', new Date(`${applied.to}T23:59:59.999Z`).toISOString())
    value.set('period', applied.period)
    if (applied.service) value.set('service', applied.service)
    if (applied.status) value.set('status', applied.status)
    return value
  }, [applied])

  const report = useQuery({
    queryKey: ['reports', params.toString()],
    queryFn: () => request<ReportsData>(`reports?${params.toString()}`),
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    setApplied(draft)
  }

  async function exportReport() {
    const response = await fetch(`/api/v1/reports/export?${params.toString()}`, { credentials: 'same-origin', cache: 'no-store' })
    if (!response.ok) throw new Error('No se pudo exportar el reporte.')
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'campusitsm-reportes.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const data = report.data
  const maxObserved = data ? Math.max(...data.series.map(item => item.observed), 1) : 1

  return <section className="reports-page">
    <PageHeading
      title="Histórico y resultados"
      subtitle="Reportes operativos basados en los Tickets seleccionados."
      illustrationIcon={ChartLine}
      action={<Button type="button" icon={Download} onClick={() => void exportReport().catch(() => undefined)} disabled={report.isPending || !!report.error}>Exportar reporte</Button>}
    />

    <Card className="reports-filter-card">
      <form className="reports-filters" onSubmit={submit}>
        <Field label="Desde"><input type="date" value={draft.from} onChange={event => setDraft({ ...draft, from: event.target.value })} /></Field>
        <Field label="Hasta"><input type="date" value={draft.to} onChange={event => setDraft({ ...draft, to: event.target.value })} /></Field>
        <Field label="Periodo"><Select value={draft.period} onChange={event => setDraft({ ...draft, period: event.target.value as typeof draft.period })}><option value="day">Diario</option><option value="week">Semanal</option><option value="month">Mensual</option></Select></Field>
        <Field label="Categoría"><Select value={draft.service} onChange={event => setDraft({ ...draft, service: event.target.value })}><option value="">Todas las categorías</option>{ticketServices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
        <Field label="Estado"><Select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value })}><option value="">Todos</option><option value="registrado">Registrado</option><option value="en_atencion">En atención</option><option value="resuelto">Resuelto</option></Select></Field>
        <Button type="submit" icon={Funnel}>Aplicar filtros</Button>
      </form>
    </Card>

    {report.isPending && <Card><p role="status">Cargando indicadores operativos…</p></Card>}
    {report.error && <Notice tone="amber" role="alert">No se pudo consultar el reporte autorizado.</Notice>}

    {data && <>
      <div className="reports-kpis">
        <Card><span>Tickets</span><strong>{data.total}</strong><small>En el periodo y alcance filtrados</small></Card>
        <Card><span>Resueltos</span><strong>{data.resolved}</strong><small>{data.resolutionRate == null ? 'Porcentaje no disponible' : `${data.resolutionRate}% del total`}</small></Card>
        <Card><span>Cumplimiento de resolución</span><strong>{data.resolvedWithinSlaRate == null ? 'No disponible' : `${data.resolvedWithinSlaRate}%`}</strong><small>Solo tickets resueltos con plazo registrado</small></Card>
      </div>

      {data.total === 0 ? <Card><EmptyState title="No hay datos operativos" description="No existen Tickets que coincidan con los filtros y el alcance autorizado." /></Card> : (
        <div className="reports-grid">
          <Card className="reports-chart-card">
            <h2>Demanda observada</h2>
            <p className="body-muted">Tickets creados por periodo. El pronóstico no está disponible.</p>
            <div className="reports-chart" role="img" aria-label="Gráfico de demanda observada por periodo">
              {data.series.map(item => <div className="reports-bar" key={item.period}>
                <span className="reports-bar__value">{item.observed}</span>
                <div className="reports-bar__track"><div className="reports-bar__fill" style={{ height: `${Math.max(item.observed ? 8 : 0, item.observed * 100 / maxObserved)}%` }} /></div>
                <span className="reports-bar__label">{item.period.slice(5)}</span>
              </div>)}
            </div>
          </Card>
          <Card className="reports-categories">
            <h2>Tickets por categoría</h2>
            {data.categories.length ? data.categories.map(item => <div className="reports-category" key={item.service}>
              <div><strong>{item.label}</strong><span>{item.percentage == null ? 'Porcentaje no disponible' : `${item.percentage}%`}</span></div>
              <div className="reports-category__track"><span style={{ width: `${item.percentage ?? 0}%` }} /></div>
              <b>{item.count}</b>
            </div>) : <EmptyState title="Sin categorías" description="No hay categorías con Tickets en el filtro actual." />}
          </Card>
        </div>
      )}

      <Notice tone="amber" icon={Info} role="status">
        <strong>Pronóstico no disponible.</strong> {data.forecastMessage} Fuente: `Tickets operativos`; Incluye tickets de demostración: {data.synthetic ? 'Sí' : 'No'}.
      </Notice>
    </>}
  </section>
}
