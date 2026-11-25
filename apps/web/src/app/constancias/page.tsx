import { Download, FileText, ShieldCheck } from '@phosphor-icons/react'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, EmptyState, Notice, PageHeading } from '../../components/ui'
import { ApiError, request } from '../../lib/api/http'
import { ticketServiceLabel } from '../../lib/api/tickets'
import type { CertificateDto, CertificatesPageDto } from '../../lib/api/certificates'

export default function ConstanciasPage() {
  const client = useQueryClient()
  const [selected, setSelected] = useState<CertificateDto | null>(null)
  const [error, setError] = useState('')
  const data = useQuery({
    queryKey: ['certificates', 'mine'],
    queryFn: () => request<CertificatesPageDto>('certificates'),
  })
  const issue = useMutation({
    mutationFn: (ticketId: string) => request<CertificateDto>(`certificates/${ticketId}/issue`, { method: 'POST', body: '{}' }),
    onSuccess: async certificate => {
      setSelected(certificate)
      setError('')
      await client.invalidateQueries({ queryKey: ['certificates', 'mine'] })
    },
    onError: (reason: unknown) => setError(reason instanceof ApiError ? reason.message : 'No se pudo emitir la constancia.'),
  })

  async function download(certificate: CertificateDto) {
    const response = await fetch(`/api/v1/certificates/${certificate.id}/download`, { credentials: 'same-origin', cache: 'no-store' })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      throw new Error(body.message || 'No se pudo descargar la constancia.')
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${certificate.code}.pdf`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  return <section className="certificate-page">
    <PageHeading
      title="Mis constancias"
      subtitle="Consulta las constancias asociadas a tus incidencias resueltas."
      illustrationIcon={FileText}
    />
    {error && <Notice tone="amber" icon={ShieldCheck} role="alert">{error}</Notice>}
    <div className="certificate-page__grid">
      <Card>
        <h2>Constancias disponibles</h2>
        {data.isLoading && <Notice tone="amber" role="status">Consultando incidencias elegibles...</Notice>}
        {data.error && <Notice tone="amber" role="alert">No se pudo consultar las constancias.</Notice>}
        {!data.isLoading && data.data && data.data.eligible.length === 0 && (
          <EmptyState title="Sin constancias disponibles" description="Solo aparecen tickets resueltos con una falla confirmada." />
        )}
        {!data.isLoading && data.data?.eligible.map(item => (
          <div className="certificate-row" key={item.ticketId}>
            <div>
              <strong>{item.ticketCode}</strong>
              <p className="body-muted">{ticketServiceLabel(item.service)} · Resuelto {new Date(item.resolvedAt).toLocaleString('es-PE')}</p>
            </div>
            {item.certificate ? (
              <Button type="button" variant="secondary" onClick={() => setSelected(item.certificate)}>Ver constancia</Button>
            ) : (
              <Button type="button" onClick={() => issue.mutate(item.ticketId)} disabled={issue.isPending}>
                {issue.isPending ? 'Emitiendo...' : 'Emitir constancia'}
              </Button>
            )}
          </div>
        ))}
      </Card>
      <Card>
        <h2>Detalle de constancia</h2>
        {selected ? <>
          <p><strong>Código:</strong> {selected.code}</p>
          <p><strong>Incidencia:</strong> {selected.ticketCode}</p>
          <p><strong>Emitida:</strong> {new Date(selected.issuedAt).toLocaleString('es-PE')}</p>
          <p className="body-muted certificate-page__hash">Huella SHA-256: {selected.sha256}</p>
          <div className="button-row">
            <Button type="button" icon={Download} onClick={() => { setError(''); void download(selected).catch(reason => setError(reason.message)) }}>Descargar PDF</Button>
            <Button variant="secondary" type="button" onClick={() => window.open(`/verificar/${encodeURIComponent(selected.code)}`, '_blank', 'noopener,noreferrer')}>
              Verificación pública
            </Button>
          </div>
        </> : <EmptyState title="Selecciona una constancia" description="El detalle y la descarga aparecerán después de emitir o seleccionar una constancia." />}
      </Card>
    </div>
  </section>;
}
