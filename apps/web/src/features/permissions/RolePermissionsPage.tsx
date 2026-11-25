import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CaretDown, Key, LockKey, MagnifyingGlass, ShieldCheck, User, Users } from '@phosphor-icons/react'
import { Button, Card, EmptyState, Field, IconBubble, Modal, Notice, PageHeading } from '../../components/ui'
import { ApiError, request } from '../../lib/api/http'
import type { components } from '../../lib/api/schema'
import './permissions.css'

type Matrix = components['schemas']['RoleMatrixDto']
type Role = components['schemas']['RoleAccessDto']
type Permission = components['schemas']['PermissionItemDto']
const queryKey = ['role-permissions']
const actions = [
  ['consultar', 'Consultar'], ['registrar', 'Registrar'], ['atender', 'Atender'], ['asignar', 'Asignar'], ['administrar', 'Administrar'],
] as const
const roleHelp: Record<string, string> = {
  estudiante: 'Acceso a sus datos, sus incidencias y su contexto académico.',
  docente: 'Acceso a sus datos, sus incidencias y su contexto académico.',
  ti_agente: 'Atención de las incidencias del equipo al que pertenece.',
  ti_supervisor: 'Atención, asignación y reportes de su equipo.',
  administrador: 'Configuración y administración de la institución. Los accesos de Usuarios y Roles y permisos permanecen protegidos.',
}
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

function SummaryCheckbox({ label, keys, selected, disabled, onChange }: {
  label: string; keys: string[]; selected: string[]; disabled: boolean; onChange: (checked: boolean) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const count = keys.filter(key => selected.includes(key)).length
  useEffect(() => { if (ref.current) ref.current.indeterminate = count > 0 && count < keys.length }, [count, keys.length])
  return <input ref={ref} className="permission-check permission-check--summary" type="checkbox" aria-label={label}
    checked={count === keys.length} disabled={disabled} onChange={event => onChange(event.target.checked)} />
}

function RoleEditor({ role, catalog, dependencies, search, onDirty, onBusy, onSaved, onReload }: {
  role: Role; catalog: Permission[]; dependencies: Record<string, string>; search: string;
  onDirty: (value: boolean) => void; onBusy: (value: boolean) => void; onSaved: (role: Role) => void; onReload: () => void
}) {
  const client = useQueryClient()
  const [snapshot, setSnapshot] = useState(role)
  const [selected, setSelected] = useState(role.permissions)
  const [reason, setReason] = useState(''), [error, setError] = useState(''), [conflict, setConflict] = useState(false), [busy, setBusy] = useState(false)
  const [expanded, setExpanded] = useState(new Set(['Calendario académico']))
  const dirty = JSON.stringify([...selected].sort()) !== JSON.stringify([...snapshot.permissions].sort())
  useEffect(() => onDirty(dirty), [dirty, onDirty])
  const editable = (key: string) => role.allowedPermissions.includes(key) && !role.protectedPermissions.includes(key)
  function toggle(keys: string[], checked: boolean) {
    setError(''); setConflict(false)
    setSelected(previous => {
      const next = new Set(previous)
      for (const key of keys.filter(editable)) { if (checked) next.add(key); else next.delete(key) }
      // Activar una acción conserva su lectura; retirar lectura retira sus acciones dependientes.
      for (const [key, dependency] of Object.entries(dependencies)) {
        if (checked && next.has(key)) next.add(dependency)
        if (!checked && !next.has(dependency) && editable(key)) next.delete(key)
      }
      return [...next].sort()
    })
  }
  function reset() { setSelected(snapshot.permissions); setReason(''); setError(''); setConflict(false) }
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy || !dirty) return
    setBusy(true); onBusy(true); setError(''); setConflict(false)
    try {
      const updated = await request<Role>(`role-permissions/${role.role}`, { method: 'PATCH', body: JSON.stringify({ permissions: selected, expectedVersion: snapshot.version, reason }) })
      setSnapshot(updated); setSelected(updated.permissions); setReason(''); onDirty(false)
      client.setQueryData<Matrix>(queryKey, previous => previous ? { ...previous, roles: previous.roles.map(item => item.role === updated.role ? updated : item) } : previous)
      onSaved(updated)
      await client.invalidateQueries({ queryKey: ['auth', 'session'] })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'No se pudieron guardar los permisos. Inténtalo de nuevo.')
      setConflict(failure instanceof ApiError && failure.code === 'CONFLICT')
    } finally { setBusy(false); onBusy(false) }
  }
  const filtered = catalog.filter(permission => normalize(`${permission.module} ${permission.label} ${permission.scope}`).includes(normalize(search.trim())))
  const groups = [...new Set(filtered.map(permission => permission.module))]
  return <div className="permission-workspace">
    <Card className="permission-editor">
      <header className="permission-editor-heading">
        <IconBubble icon={role.role === 'administrador' ? ShieldCheck : User} />
        <div><h2>{role.label}</h2><p>Permisos del rol en la institución</p></div>
        <div className="permission-count"><strong>{selected.length}</strong><span>de {role.allowedPermissions.length} permisos asignables</span></div>
      </header>
      {error && <Notice tone="amber" role="alert">{error}{conflict && <Button variant="ghost" onClick={onReload}>Actualizar matriz</Button>}</Notice>}
      {dirty && <p className="permission-unsaved" role="status">Cambios sin guardar</p>}
      <p className="permission-scroll-hint">Desliza la tabla para ver todas las acciones.</p>
      {groups.length ? <div className="permission-table-scroll" tabIndex={0} role="region" aria-label="Tabla de permisos, desplazamiento horizontal">
        <table className="permission-table" aria-label={`Matriz de permisos de ${role.label}`}>
          <thead><tr><th scope="col">Módulo / Acción</th>{actions.map(([key, label]) => <th scope="col" key={key}>{label}</th>)}</tr></thead>
          <tbody>{groups.map(module => {
            const modulePermissions = filtered.filter(permission => permission.module === module)
            const open = expanded.has(module)
            return <ModuleRows key={module} module={module} permissions={modulePermissions} role={role} selected={selected} busy={busy}
              open={open} toggle={toggle} editable={editable} onExpand={() => setExpanded(previous => {
                const next = new Set(previous); if (next.has(module)) next.delete(module); else next.add(module); return next
              })} />
          })}</tbody>
        </table>
      </div> : <EmptyState title="No encontramos permisos" description="Prueba con otro nombre de módulo o acción." />}
      <form className="permission-save" onSubmit={save}>
        <Field label="Motivo del cambio" required hint="El motivo quedará registrado junto con los permisos anteriores y nuevos.">
          <textarea className="input" minLength={5} maxLength={500} required rows={2} value={reason} disabled={busy} onChange={event => setReason(event.target.value)} />
        </Field>
        <div className="permission-save-actions"><Button variant="secondary" disabled={!dirty || busy} onClick={reset}>Descartar cambios</Button><Button type="submit" disabled={!dirty || busy}>{busy ? 'Guardando…' : 'Guardar permisos'}</Button></div>
      </form>
    </Card>
    <aside className="permission-about">
      <Card><IconBubble icon={role.role === 'administrador' ? ShieldCheck : User} /><h2>Acerca de este rol</h2><strong>{role.label}</strong><p>{roleHelp[role.role]}</p><p>Los cambios se aplican a todas las personas con este rol en la institución. Cada permiso conserva su alcance.</p></Card>
      <Notice icon={LockKey}><div><strong>Acceso protegido</strong><p>Solo administración puede guardar cambios. Los permisos que exceden el alcance del rol permanecen bloqueados.</p></div></Notice>
      <Notice><div><strong>Funciones pendientes</strong><p>Puedes configurar sus permisos, pero estarán disponibles cuando se habilite cada función.</p></div></Notice>
    </aside>
  </div>
}

function ModuleRows({ module, permissions, role, selected, busy, open, toggle, editable, onExpand }: {
  module: string; permissions: Permission[]; role: Role; selected: string[]; busy: boolean; open: boolean;
  toggle: (keys: string[], checked: boolean) => void; editable: (key: string) => boolean; onExpand: () => void
}) {
  return <>
    <tr className="permission-module-row">
      <th scope="row"><button type="button" className="permission-module-button" aria-expanded={open} onClick={onExpand}><Key size={19} aria-hidden="true" /><span>{module}</span><CaretDown className={open ? 'is-open' : ''} size={16} aria-hidden="true" /></button></th>
      {actions.map(([action, label]) => {
        const keys = permissions.filter(permission => permission.action === action && role.allowedPermissions.includes(permission.key)).map(permission => permission.key)
        return <td key={action}>{keys.length ? <SummaryCheckbox label={`${module}: ${label}`} keys={keys} selected={selected} disabled={busy || !keys.some(editable)} onChange={checked => toggle(keys, checked)} /> : <span className="permission-na" title="No corresponde al alcance de este rol">—</span>}</td>
      })}
    </tr>
    {open && <tr className="permission-detail-row"><td colSpan={6}><fieldset><legend>Acciones de {module}</legend><div className="permission-options">{permissions.map(permission => {
      const locked = role.protectedPermissions.includes(permission.key), allowed = role.allowedPermissions.includes(permission.key)
      return <label className={`permission-option ${!allowed ? 'permission-option--blocked' : ''}`} key={permission.key}>
        <input className="permission-check" type="checkbox" checked={selected.includes(permission.key)} disabled={busy || !editable(permission.key)} onChange={event => toggle([permission.key], event.target.checked)} />
        <span><strong>{permission.label}{locked && <LockKey size={14} aria-label="Permiso protegido" />}</strong><small>{permission.scope}{!allowed ? ' · Fuera del alcance de este rol' : locked ? ' · Protegido' : ''}</small>{!permission.available && <small className="permission-pending">Función pendiente</small>}</span>
      </label>
    })}</div></fieldset></td></tr>}
  </>
}

export default function RolePermissionsPage() {
  const navigate = useNavigate()
  const matrix = useQuery({ queryKey, queryFn: () => request<Matrix>('role-permissions') })
  const [selectedRole, setSelectedRole] = useState('estudiante'), [search, setSearch] = useState(''), [message, setMessage] = useState('')
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [revision, setRevision] = useState(0)
  const [pending, setPending] = useState<{ type: 'role' | 'navigation' | 'reload'; target: string } | null>(null)
  useEffect(() => {
    if (!dirty && !busy) return
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const leave = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.origin !== location.origin || anchor.pathname === location.pathname) return
      event.preventDefault(); event.stopPropagation()
      if (!busy) setPending({ type: 'navigation', target: `${anchor.pathname}${anchor.search}${anchor.hash}` })
    }
    window.addEventListener('beforeunload', unload); document.addEventListener('click', leave, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', leave, true) }
  }, [dirty, busy])
  async function execute(action: { type: 'role' | 'navigation' | 'reload'; target: string }) {
    setPending(null); setDirty(false); setMessage('')
    if (action.type === 'role') setSelectedRole(action.target)
    if (action.type === 'navigation') navigate(action.target)
    if (action.type === 'reload') { await matrix.refetch(); setRevision(value => value + 1) }
  }
  function choose(action: { type: 'role' | 'navigation' | 'reload'; target: string }) {
    if (dirty) setPending(action); else void execute(action)
  }
  return <div className="content-stack permissions-page">
    <PageHeading title="Roles y permisos" subtitle="Define qué puede hacer cada rol dentro de su alcance en la institución." illustration={false} />
    {message && <Notice role="status">{message}</Notice>}
    {matrix.isPending && !matrix.data && !message ? <Card><p role="status">Cargando roles y permisos…</p></Card> : matrix.error ? <Notice tone="amber" role="alert">{matrix.error.message}<Button variant="ghost" onClick={() => { void matrix.refetch() }}>Reintentar</Button></Notice> : matrix.data && <>
      <div className="permission-toolbar"><label className="permission-search"><MagnifyingGlass size={20} aria-hidden="true" /><input className="input" type="search" aria-label="Buscar permisos o módulos" placeholder="Buscar permisos o módulos…" value={search} onChange={event => setSearch(event.target.value)} /></label></div>
      <div className="permission-role-list" aria-label="Seleccionar rol">{matrix.data.roles.map(role => <button className={`permission-role ${selectedRole === role.role ? 'is-selected' : ''}`} type="button" aria-pressed={selectedRole === role.role} key={role.role} disabled={busy} onClick={() => { if (role.role !== selectedRole) choose({ type: 'role', target: role.role }) }}>
        {role.role === 'administrador' ? <ShieldCheck size={26} aria-hidden="true" /> : role.role.startsWith('ti_') ? <Users size={26} aria-hidden="true" /> : <User size={26} aria-hidden="true" />}<span><strong>{role.label}</strong><small>Permisos del rol</small></span>
      </button>)}</div>
      {matrix.data.roles.filter(role => role.role === selectedRole).map(role => <RoleEditor key={`${role.role}-${revision}`} role={role} catalog={matrix.data!.catalog} dependencies={matrix.data!.dependencies} search={search} onDirty={setDirty} onBusy={setBusy} onSaved={updated => setMessage(`Permisos de ${updated.label} guardados.`)} onReload={() => choose({ type: 'reload', target: '' })} />)}
    </>}
    <Modal open={!!pending} title="Descartar cambios sin guardar" onClose={() => setPending(null)}><div className="modal__body"><p>Los cambios de este rol todavía no se guardaron. ¿Quieres descartarlos para continuar?</p></div><div className="modal__actions"><Button variant="secondary" onClick={() => setPending(null)}>Seguir editando</Button><Button variant="danger" onClick={() => { if (pending) void execute(pending) }}>Descartar y continuar</Button></div></Modal>
  </div>
}
