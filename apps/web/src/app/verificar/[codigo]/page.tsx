import { ArrowLeft, MagnifyingGlass, ShieldWarning, Warning } from '@phosphor-icons/react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button, Card, Field, FormError, Notice } from '../../../components/ui'

export default function VerifyCertificatePage() {
  const { codigo = '' } = useParams()
  const navigate = useNavigate()
  const [value, setValue] = useState(codigo)
  const [submittedCode, setSubmittedCode] = useState(codigo)
  const [submitted, setSubmitted] = useState(Boolean(codigo))

  useEffect(() => {
    setValue(codigo)
    setSubmittedCode(codigo)
    setSubmitted(Boolean(codigo))
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
  const verificationPending = Boolean(trimmedCode) && !formatError
  const statusClass = formatError || emptyCode ? 'verification-card--invalid' : 'verification-card--pending'

  return <section className="public-page">
    <div className="public-brand" aria-label="CampusITSM">
      <strong>CampusITSM</strong>
    </div>
    <Card className={`verification-card ${statusClass}`}>
      <div className={`valid-icon verification-status-icon ${formatError || emptyCode ? 'verification-status-icon--invalid' : 'verification-status-icon--pending'}`} aria-hidden="true">
        {formatError || emptyCode ? <Warning size={34} /> : <ShieldWarning size={34} />}
      </div>
      <h1>
        {emptyCode ? 'Código requerido' : formatError ? 'Formato de código incorrecto' : 'Verificación pendiente'}
      </h1>
      <p className="verification-copy">
        {emptyCode
          ? 'Introduce un código de constancia para iniciar la consulta.'
          : formatError
            ? 'Revisa el formato introducido. El código no se ha consultado y no se ha determinado si existe.'
            : verificationPending
              ? `El código ${submittedCode} fue recibido, pero la verificación real todavía no está disponible.`
              : 'Introduce un código de constancia para iniciar la consulta.'}
      </p>
      {formatError || emptyCode ? (
        <FormError message={emptyCode ? 'El código de constancia es obligatorio.' : 'El código no puede contener espacios.'} />
      ) : (
        <Notice tone="amber" role="status">
          No se ha consultado ninguna constancia ni se muestran datos personales.
        </Notice>
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
