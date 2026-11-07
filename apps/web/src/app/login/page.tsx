import { useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate } from 'react-router-dom'
import { ArrowRight, EnvelopeSimple, Eye, EyeSlash, GraduationCap, LockKey, ShieldCheck } from '@phosphor-icons/react'
import { Button, Card, Field, Notice, SupportIllustration } from '../../components/ui'
import { ApiError, request } from '../../lib/api/http'
import { useAuth, type Session } from '../../features/auth/AuthContext'
import '../../features/auth/auth.css'

type Mode = 'login' | 'register' | 'recover' | 'reset'
const titles: Record<Mode, string> = { login: 'Ingresa a CampusITSM', register: 'Crea tu cuenta', recover: 'Recupera tu acceso', reset: 'Cambia tu contraseña' }
const descriptions: Record<Mode, string> = {
  login: 'Accede a la mesa de servicios de la Universidad Privada Tallán.',
  register: 'Regístrate para reportar y consultar tus incidencias.',
  recover: 'Te enviaremos un enlace para crear una nueva contraseña.',
  reset: 'Tu enlace fue validado. Elige una nueva contraseña.',
}
export default function LoginPage() {
  const auth = useAuth(), client = useQueryClient(), navigate = useNavigate()
  const status = useQuery({ queryKey: ['auth', 'status'], queryFn: () => request<{ available: boolean; registrationEnabled: boolean }>('auth/status') })
  const [mode, setMode] = useState<Mode>(() => new URLSearchParams(location.search).get('recovery') === '1' ? 'reset' : 'login')
  const recovery = useQuery({ queryKey: ['auth', 'recovery'], queryFn: () => request<{ csrfToken: string }>('auth/recovery/status'), enabled: mode === 'reset', retry: false })
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false), [busy, setBusy] = useState(false)
  const [error, setError] = useState(''), [fields, setFields] = useState<Record<string, string>>({})
  const [message, setMessage] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.has('confirmed') ? 'Correo confirmado. Ya puedes iniciar sesión.' : params.has('link') ? 'El enlace venció o se abrió en otro navegador. Solicita otro enlace desde este navegador.' : params.get('closed') === 'local' ? 'Tu sesión local se cerró. El proveedor no pudo confirmar el cierre remoto.' : ''
  })
  const next = auth.user?.role === 'administrador' ? '/admin/calendario' : '/calendario'
  if (auth.user && mode !== 'reset') return <Navigate to={next} replace />
  function changeMode(value: Mode) { setMode(value); setError(''); setFields({}); setMessage(''); setPassword('') }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (busy) return
    setBusy(true); setError(''); setMessage(''); setFields({})
    const paths: Record<Mode, string> = { login: 'login', register: 'register', recover: 'recovery/request', reset: 'recovery/reset' }
    try {
      const result = await request<Session & { message: string }>(`auth/${paths[mode]}`, { method: 'POST', body: JSON.stringify({ email, password, displayName: name }), headers: mode === 'reset' ? { 'X-CSRF-Token': recovery.data!.csrfToken } : {} })
      setPassword('')
      if (mode === 'login') {
        await client.cancelQueries(); client.removeQueries({ predicate: q => q.queryKey[0] !== 'auth' }); client.setQueryData(['auth', 'session'], result)
        navigate(result.user.role === 'administrador' ? '/admin/calendario' : '/calendario', { replace: true })
      } else {
        setMessage(result.message)
        if (mode === 'reset') { client.removeQueries({ predicate: q => q.queryKey[0] !== 'auth' }); client.setQueryData(['auth', 'session'], null); navigate('/login', { replace: true }) }
        setMode(mode === 'recover' ? 'recover' : 'login')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo completar la solicitud. Inténtalo nuevamente.')
      if (e instanceof ApiError) setFields(e.fields)
    } finally { setBusy(false) }
  }
  const hasPassword = ['login', 'register', 'reset'].includes(mode)
  const unavailable = status.isError || status.data?.available === false || (mode === 'reset' && (recovery.isPending || recovery.isError))
  return <main className="auth-page" id="main-content">
    <div className="auth-brand brand"><GraduationCap className="brand__icon" size={43} weight="duotone" aria-hidden="true" /><span><strong>CampusITSM</strong><small>Universidad Privada Tallán</small></span></div>
    <div className="auth-content">
      <section className="auth-intro" aria-labelledby="auth-intro-title">
        <SupportIllustration symbol={GraduationCap} />
        <span className="auth-eyebrow">MESA DE SERVICIOS UNIVERSITARIOS</span>
        <h1 id="auth-intro-title">Tu soporte de TI,<br /> más cerca.</h1>
        <p>Reporta incidencias, consulta su avance y organiza tus actividades académicas en un solo lugar.</p>
        <Notice icon={ShieldCheck}>Tu acceso y tus herramientas dependen de los permisos asignados a tu cuenta.</Notice>
      </section>
      <Card className="auth-card">
        <div className="auth-card__heading"><span className="auth-section-label">ACCESO A CAMPUSITSM</span><h2>{titles[mode]}</h2><p className="body-muted">{descriptions[mode]}</p></div>
        {unavailable && <Notice tone="amber" role="status">{mode === 'reset' ? 'Necesitas un enlace de recuperación válido abierto en este navegador.' : 'El acceso todavía no está disponible. Contacta con administración.'}<Button variant="ghost" onClick={() => { void status.refetch(); if (mode === 'reset') void recovery.refetch() }}>Comprobar de nuevo</Button></Notice>}
        {message && <Notice role="status">{message}</Notice>}
        {error && <Notice tone="amber" role="alert">{error}</Notice>}
        <form className="auth-form" onSubmit={submit} aria-busy={busy}>
          {mode === 'register' && <Field label="Nombre y apellidos" required hint={fields.displayName}><input className="input" required minLength={2} maxLength={120} autoComplete="name" value={name} onChange={e => setName(e.target.value)} aria-invalid={!!fields.displayName} /></Field>}
          {mode !== 'reset' && <Field label="Correo electrónico" required hint={fields.email}><span className="auth-input"><EnvelopeSimple size={20} aria-hidden="true" /><input className="input" type="email" required maxLength={254} autoComplete="email" placeholder="tu.correo@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!fields.email} /></span></Field>}
          {hasPassword && <Field label={mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'} required hint={fields.password || (mode !== 'login' ? 'Usa al menos 10 caracteres.' : undefined)}><span className="auth-input"><LockKey size={20} aria-hidden="true" /><input className="input" type={showPassword ? 'text' : 'password'} required minLength={mode === 'login' ? 1 : 10} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!fields.password} /><button type="button" className="icon-button" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}</button></span></Field>}
          {mode === 'login' && <button type="button" className="auth-link auth-recovery" onClick={() => changeMode('recover')}>Olvidé mi contraseña</button>}
          <Button type="submit" disabled={busy || status.isPending || unavailable || auth.loading} className="auth-submit">{busy ? 'Procesando…' : mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : mode === 'recover' ? 'Enviar enlace' : 'Guardar contraseña'}<ArrowRight size={19} aria-hidden="true" /></Button>
        </form>
        <div className="auth-alternatives">{mode === 'login' ? <p>¿Aún no tienes cuenta? <button type="button" className="auth-link" disabled={busy} onClick={() => changeMode('register')}>Regístrate</button></p> : <button type="button" className="auth-link" disabled={busy} onClick={() => changeMode('login')}>Volver a iniciar sesión</button>}</div>
      </Card>
    </div>
    <footer className="auth-footer"><span>CampusITSM · Universidad Privada Tallán</span><span>Prototipo académico · Institución ficticia</span></footer>
  </main>
}
