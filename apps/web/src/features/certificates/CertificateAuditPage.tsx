import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Field, Notice, PageHeading, Select } from '../../components/ui'
import { request } from '../../lib/api/http'
import type { CertificateAuditPageDto } from '../../lib/api/certificates'
import './certificates.css'

const actionLabels: Record<string, string> = {
  emitida: 'Emitida',
  descargada: 'Descargada',
  consultada: 'Código consultado',
  valida: 'PDF íntegro',
  alterado: 'PDF alterado',
  archivo_no_verificable: 'Archivo no verificable',
}

function localDate(value: string) {
  return new Date(value).toLocaleString('es-PE')
}

export default function CertificateAuditPage() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ from: '', to: '', code: '', actorId: '', action: '' })
  const [applied, setApplied] = useState(filters)
  const query = useQuery({
    queryKey: ['certificates', 'audit', applied, page],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' })
      if (applied.from) params.set('from', new Date(`${applied.from}T00:00:00`).toISOString())
      if (applied.to) params.set('to', new Date(`${applied.to}T23:59:59.999`).toISOString())
      if (applied.code.trim()) params.set('code', applied.code.trim())
      if (applied.actorId.trim()) params.set('actorId', applied.actorId.trim())
      if (applied.action) params.set('action', applied.action)
      return request<CertificateAuditPageDto>(`certificates/audit?${params}`)
    },
  })

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPage(1)
    setApplied(filters)
  }

  const totalPages = query.data ? Math.max(1, Math.ceil(query.data.total / query.data.pageSize)) : 1

  return <section className="certificate-audit">
    <PageHeading
      title="Auditoría de constancias"
      subtitle="Registro de emisiones, descargas y verificaciones públicas de tu institución."
      illustrationIcon={undefined}
    />
    <Card>
      <form className="certificate-audit-filters" onSubmit={applyFilters}>
        <Field label="Desde">
          <input className="input" type="date" value={filters.from} onChange={event => setFilters({ ...filters, from: event.target.value })} />
        </Field>
        <Field label="Hasta">
          <input className="input" type="date" value={filters.to} onChange={event => setFilters({ ...filters, to: event.target.value })} />
        </Field>
        <Field label="Código de constancia">
          <input className="input" value={filters.code} maxLength={64} onChange={event => setFilters({ ...filters, code: event.target.value })} placeholder="CITS-…" />
        </Field>
        <Field label="ID del actor">
          <input className="input" value={filters.actorId} maxLength={36} onChange={event => setFilters({ ...filters, actorId: event.target.value })} placeholder="UUID del usuario" />
        </Field>
        <Field label="Acción">
          <Select value={filters.action} onChange={event => setFilters({ ...filters, action: event.target.value })}>
            <option value="">Todas</option>
            {Object.entries(actionLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </Select>
        </Field>
        <Button type="submit">Aplicar filtros</Button>
      </form>
    </Card>
    <Card>
      <h2>Eventos registrados</h2>
      {query.isPending && <p role="status">Consultando auditoría…</p>}
      {query.error && <Notice tone="amber" role="alert">{query.error.message}</Notice>}
      {query.data && query.data.items.length === 0 && <p>No hay eventos para los filtros seleccionados.</p>}
      {query.data && query.data.items.length > 0 && <>
        <div className="workflow-table-wrap">
          <table className="workflow-table">
            <caption className="sr-only">Eventos de auditoría de constancias</caption>
            <thead><tr><th>Fecha</th><th>Acción</th><th>Constancia</th><th>Incidencia</th><th>Actor</th></tr></thead>
            <tbody>{query.data.items.map(item => <tr key={item.id}>
              <td>{localDate(item.occurredAt)}</td>
              <td>{actionLabels[item.action] ?? item.action}</td>
              <td>{item.code}</td>
              <td>{item.ticketCode ?? '—'}</td>
              <td>{item.actorId ?? 'Verificación pública'}</td>
            </tr>)}</tbody>
          </table>
        </div>
        <div className="certificate-audit-pagination">
          <span>{query.data.total} eventos · Página {page} de {totalPages}</span>
          <div>
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Anterior</Button>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(current => current + 1)}>Siguiente</Button>
          </div>
        </div>
      </>}
    </Card>
  </section>
}
