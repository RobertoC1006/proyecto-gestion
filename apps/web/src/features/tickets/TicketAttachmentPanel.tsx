import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Card, Field, Notice } from '../../components/ui'
import { ApiError } from '../../lib/api/http'
import { downloadEvidence, ticketApi } from '../../lib/api/tickets'
import { useAuth } from '../auth/AuthContext'

export function TicketAttachmentPanel({ ticketId }: { ticketId: string }) {
  const { user } = useAuth()
  const client = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const attachment = useQuery({ queryKey: ['tickets', 'attachment', ticketId],
    queryFn: () => ticketApi.attachment(ticketId), retry: false })
  const status = useQuery({ queryKey: ['tickets', 'attachment-status'], queryFn: ticketApi.attachmentStatus,
    enabled: !!user?.permissions.includes('tickets:create') })
  const missing = attachment.error instanceof ApiError && attachment.error.status === 404
  async function upload() {
    if (!file || busy) return
    setBusy(true); setMessage('')
    try {
      await ticketApi.attach(ticketId, file)
      await client.invalidateQueries({ queryKey: ['tickets', 'attachment', ticketId] })
      setFile(null)
      setMessage('Evidencia adjuntada.')
    } catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo adjuntar la evidencia.') }
    finally { setBusy(false) }
  }
  async function download() {
    if (!attachment.data || busy) return
    setBusy(true); setMessage('')
    try { await downloadEvidence(ticketId, attachment.data.originalName) }
    catch (error) { setMessage(error instanceof Error ? error.message : 'No se pudo descargar la evidencia.') }
    finally { setBusy(false) }
  }
  return <Card><h2>Evidencia del reporte</h2>
    {attachment.isPending ? <p role="status">Comprobando evidencia…</p> : attachment.data ? <>
      <p>{attachment.data.originalName} · {(attachment.data.sizeBytes / 1024).toFixed(1)} KiB</p>
      <Button disabled={busy} onClick={() => void download()}>Descargar evidencia</Button>
    </> : missing ? <>
      <p>Este reporte no tiene evidencia adjunta.</p>
      {status.data?.configured ? <><Field label="Adjuntar evidencia" hint="PNG, JPG o PDF; máximo 5 MiB. Solo se admite un archivo."><input className="input" type="file" accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf" onChange={event => setFile(event.target.files?.[0] ?? null)} /></Field>
        <Button disabled={!file || busy} onClick={() => void upload()}>{busy ? 'Adjuntando…' : 'Adjuntar evidencia'}</Button></>
      : <p>La carga estará disponible cuando se habilite el almacenamiento privado.</p>}
    </> : <Notice tone="amber" role="alert">No se pudo comprobar la evidencia. <Button variant="ghost" onClick={() => void attachment.refetch()}>Reintentar</Button></Notice>}
    {message && <Notice tone="amber" role="status">{message}</Notice>}
  </Card>
}
