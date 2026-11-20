import { ArrowLeft, MagnifyingGlass, ShieldWarning, Warning } from '@phosphor-icons/react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Field, FormError, Notice } from '../../../components/ui'

export default function VerifyCertificatePage() {
  const { codigo = '' } = useParams()
  const navigate = useNavigate()
  const [value, setValue] = useState(codigo)
  const [submittedCode, setSubmittedCode] = useState(codigo)
  const [submitted, setSubmitted] = useState(Boolean(codigo))
  const [lookup, setLookup] = useState<{ holder: string; service: string; resolvedAt: string; issuedAt: string; status: string } | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [integrity, setIntegrity] = useState<'valida' | 'alterado' | 'archivo_no_verificable' | null>(null)
  const [integrityMessage, setIntegrityMessage] = useState('')

  useEffect(() => {
    setValue(codigo)
    setSubmittedCode(codigo)
    setSubmitted(Boolean(codigo))
    setLookup(null)
    setLookupError('')
    setIntegrity(null)
    if (!codigo.trim()) return
    const run = async () => {
      setLookupLoading(true)
      try {
        const response = await fetch(`/api/v1/certificates/public/${encodeURIComponent(codigo.trim())}`, { cache: 'no-store' })
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.message || 'No existe una constancia para este código.')
        setLookup(body)
      } catch (reason) {
        setLookupError(reason instanceof Error ? reason.message : 'No existe una constancia para este código.')
      } finally {
        setLookupLoading(false)
      }
    }
    void run()
  }, [codigo])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextCode = value.trim()
    setSubmitted(true)
    if (nextCode) navigate(`/verificar/${encodeURIComponent(nextCode)}`)
  }

  const trimmedCode = submittedCode.trim()
  const emptyCode = submitted && !value.trim()
  const formatError = Boolean(trimmedCode) && /\s/.test(submittedCode)
  const notFound = Boolean(lookupError)
  const verificationPending = Boolean(trimmedCode) && !formatError && !lookup && !notFound && lookupLoading
  const statusClass = formatError || emptyCode || notFound || integrity === 'alterado' || integrity === 'archivo_no_verificable'
    ? 'verification-card--invalid'
    : lookup || integrity === 'valida' ? 'verification-card--valid' : 'verification-card--pending'

  async function verifyFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setIntegrityMessage('')
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setIntegrity('archivo_no_verificable')
      setIntegrityMessage('Selecciona un archivo PDF.')
      return
    }
    if (file.size > 5_242_880) {
      setIntegrity('archivo_no_verificable')
      setIntegrityMessage('El PDF supera el límite permitido de 5 MiB.')
      return
    }
    const pdfBase64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '')
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    }).catch(() => '')
    if (!pdfBase64) {
      setIntegrity('archivo_no_verificable')
      setIntegrityMessage('No se pudo leer el PDF.')
      return
    }
    const response = await fetch(`/api/v1/certificates/public/${encodeURIComponent(trimmedCode)}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pdfBase64 }),
    })
    const body = await response.json().catch(() => ({}))
    if (body.status === 'valida') {
      setIntegrity('valida')
      setIntegrityMessage('El PDF corresponde con la huella registrada.')
    } else if (body.status === 'alterado') {
      setIntegrity('alterado')
      setIntegrityMessage('El archivo presentado no coincide con la emisión registrada.')
    } else {
      setIntegrity('archivo_no_verificable')
      setIntegrityMessage(body.message || 'El archivo no pudo verificarse.')
    }
  }

  return <section className="public-page">
    <div className="public-brand" aria-label="CampusITSM">
      <strong>CampusITSM</strong>
    </div>
    <Card className={`verification-card ${statusClass}`}>
      <div className={`valid-icon verification-status-icon ${formatError || emptyCode ? 'verification-status-icon--invalid' : 'verification-status-icon--pending'}`} aria-hidden="true">
        {formatError || emptyCode ? <Warning size={34} /> : <ShieldWarning size={34} />}
      </div>
      <h1>
        {emptyCode ? 'Código requerido' : formatError ? 'Formato de código incorrecto' : notFound ? 'Constancia inexistente' : integrity === 'valida' ? 'Constancia válida e íntegra' : integrity === 'alterado' ? 'Documento alterado' : lookup ? 'Constancia encontrada' : 'Verificación pendiente'}
      </h1>
      <p className="verification-copy">
        {emptyCode
          ? 'Introduce un código de constancia para iniciar la consulta.'
          : formatError
            ? 'Revisa el formato introducido. El código no se ha consultado y no se ha determinado si existe.'
            : notFound
              ? 'No existe una constancia para el código indicado.'
              : verificationPending
                ? `Consultando el código ${submittedCode}...`
              : lookup
                ? `El código corresponde a una constancia emitida para ${lookup.holder}.`
              : 'Introduce un código de constancia para iniciar la consulta.'}
      </p>
      {formatError || emptyCode || notFound ? (
        <FormError message={emptyCode ? 'El código de constancia es obligatorio.' : notFound ? 'No existe una constancia para el código indicado.' : 'El código no puede contener espacios.'} />
      ) : lookup ? (
        <Notice tone="amber" role="status">
          Servicio: {lookup.service}. Resolución: {new Date(lookup.resolvedAt).toLocaleString('es-PE')}.
        </Notice>
      ) : (
        <Notice tone="amber" role="status">No se ha determinado si existe una constancia.</Notice>
      )}
      {lookup && (
        <div className="verification-integrity">
          <Field label="Comprobar integridad de un PDF">
            <input type="file" accept=".pdf,application/pdf" onChange={event => void verifyFile(event)} />
          </Field>
          {integrityMessage && (
            <Notice tone={integrity === 'valida' ? 'green' : 'amber'} role="status">{integrityMessage}</Notice>
          )}
        </div>
      )}
      <form className="verification-form" onSubmit={submit}>
        <Field label="Código de constancia">
          <input
            id="verification-code"
            value={value}
            onChange={event => setValue(event.target.value)}
            placeholder="Introduce un código"
            autoComplete="off"
            aria-invalid={emptyCode || formatError}
            aria-describedby="verification-code-help verification-code-error"
          />
          <span id="verification-code-help" className="field__hint">
            La consulta se habilitará cuando el servicio esté disponible.
          </span>
        </Field>
        <span id="verification-code-error" className="verification-code-error">
          {emptyCode ? 'El código de constancia es obligatorio.' : formatError ? 'El código no puede contener espacios.' : ''}
        </span>
        <Button type="submit" icon={MagnifyingGlass} disabled={!value.trim()}>
          Consultar código
        </Button>
      </form>
      <Link className="back-link" to="/constancias"><ArrowLeft size={15} aria-hidden="true" />Volver a CampusITSM</Link>
    </Card>
    <p className="public-footer">Verificación pública de constancias · CampusITSM</p>
  </section>;
}
