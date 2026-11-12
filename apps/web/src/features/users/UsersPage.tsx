import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Buildings, GearSix, GraduationCap, Headset, MagnifyingGlass, ShieldCheck, User, UserCircle, UsersThree, WarningCircle, type Icon } from '@phosphor-icons/react'
import { Button, Card, CardHeading, EmptyState, Field, FormError, Modal, Notice, PageHeading, Select } from '../../components/ui'
import { getUser, isApiError, listTeams, listUsers, roleLabels, roles, updateUserAccess, type CampusRole, type SupportTeam, type UserItem, type UserStatusFilter } from '../../lib/api/users'
import './users.css'

const pageSize = 10
const initialFilters = { role: '', active: 'all' as UserStatusFilter, teamId: '', search: '' }
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la solicitud.'
const roleDetails: Record<CampusRole, { icon: Icon; description: string }> = {
  estudiante: { icon: User, description: 'Reportes y consultas propias' },
  docente: { icon: GraduationCap, description: 'Reportes y contexto académico' },
  ti_agente: { icon: Headset, description: 'Atención de su equipo' },
  ti_supervisor: { icon: ShieldCheck, description: 'Supervisión de su equipo' },
  administrador: { icon: GearSix, description: 'Administración institucional' },
}

function UserStatus({ active }: { active: boolean }) {
  return <span className={`user-status user-status--${active ? 'active' : 'inactive'}`}><span aria-hidden="true" />{active ? 'Activo' : 'Inactivo'}</span>
}

function UserTable({ users, onSelect }: { users: UserItem[]; onSelect: (id: string, opener: HTMLButtonElement) => void }) {
  if (!users.length) return <EmptyState title="No encontramos usuarios" description="Prueba con otros filtros o limpia la búsqueda." />
  return <div className="users-table-wrap"><table className="users-table">
    <caption className="users-sr-only">Directorio de usuarios con rol, equipo y estado de acceso.</caption>
    <thead><tr><th>Usuario</th><th>Rol</th><th>Equipo</th><th>Estado</th><th><span className="users-sr-only">Acción</span></th></tr></thead>
    <tbody>{users.map(user => <tr key={user.id}>
      <td><button className="user-cell" type="button" onClick={event => onSelect(user.id, event.currentTarget)}><span className="user-avatar"><UserCircle size={24} aria-hidden="true" /></span><span><strong>{user.displayName}</strong><small>{user.email}</small></span></button></td>
      <td><span className="user-role-label">{roleLabels[user.role]}</span></td>
      <td>{user.team ? <span><strong>{user.team.name}</strong><small className="user-table-subtext">{user.team.code}</small></span> : <span className="user-muted">Sin equipo</span>}</td>
      <td><UserStatus active={user.active} /></td>
      <td><Button variant="secondary" className="user-edit-button" onClick={event => onSelect(user.id, event.currentTarget)}>Editar</Button></td>
    </tr>)}</tbody>
  </table></div>
}

function AccessChoice({ name, value, label, description, icon: Icon, checked, disabled, onChange }: {
  name: string; value: string; label: string; description: string; icon: Icon; checked: boolean; disabled: boolean; onChange: () => void
}) {
  return <label className={`user-choice ${checked ? 'is-selected' : ''}`}>
    <input type="radio" name={name} value={value} aria-label={label} checked={checked} disabled={disabled} onChange={onChange} />
    <Icon className="user-choice-icon" size={25} aria-hidden="true" />
    <span><strong>{label}</strong><small>{description}</small></span>
  </label>
}

function AccessForm({ user, teams, onClose, onSaved, onDirty, onBusy, onReload }: {
  user: UserItem; teams: SupportTeam[]; onClose: () => void; onSaved: (user: UserItem) => void;
  onDirty: (dirty: boolean) => void; onBusy: (busy: boolean) => void; onReload: () => Promise<unknown>
}) {
  const [draft, setDraft] = useState({ role: user.role, active: user.active, teamId: user.teamId ?? '', reason: '' })
  const { role, active, teamId, reason } = draft
  const [fieldError, setFieldError] = useState('')
  const [reloading, setReloading] = useState(false)
  const mutation = useMutation({ mutationFn: () => updateUserAccess(user.id, { role, active, teamId: teamId || null, reason: reason.trim(), expectedVersion: user.accessVersion }), onSuccess: onSaved, onSettled: () => onBusy(false) })
  const busy = mutation.isPending || reloading
  const accessChanged = role !== user.role || active !== user.active || teamId !== (user.teamId ?? '')
  const dirty = accessChanged || reason.length > 0
  function change(patch: Partial<typeof draft>) {
    const next = { ...draft, ...patch }
    setDraft(next)
    onDirty(next.role !== user.role || next.active !== user.active || next.teamId !== (user.teamId ?? '') || next.reason.length > 0)
  }
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (busy || !accessChanged) return
    if (reason.trim().length < 5 || reason.trim().length > 500) { setFieldError('Escribe un motivo de entre 5 y 500 caracteres.'); return }
    setFieldError(''); onBusy(true); mutation.mutate()
  }
  async function reload() { setReloading(true); onBusy(true); try { await onReload() } finally { setReloading(false); onBusy(false) } }
  const apiError = mutation.error
  const conflict = isApiError(apiError) && apiError.code === 'CONFLICT'
  const lastAdmin = isApiError(apiError) && apiError.code === 'LAST_ADMINISTRATOR'

  return <form onSubmit={submit} className="user-access-form">
    <div className="modal__body user-editor-body">
      <div className="user-editor-profile"><span className="user-avatar"><UserCircle size={30} aria-hidden="true" /></span><div><h3>{user.displayName}</h3><p>{user.email}</p></div><UserStatus active={user.active} /></div>
      {apiError && <Notice tone="amber" icon={WarningCircle} role="alert"><strong>{conflict ? 'El acceso cambió' : lastAdmin ? 'Debe permanecer un administrador activo' : 'No se pudo guardar el acceso'}</strong><p>{errorMessage(apiError)}</p>{conflict && <Button variant="ghost" disabled={busy} onClick={() => void reload()}>Recargar perfil</Button>}</Notice>}
      <fieldset className="user-choice-section" disabled={busy}>
        <legend>Rol del usuario</legend><p>Selecciona un rol. Sus permisos se administran en Roles y permisos.</p>
        <div className="user-role-options">{roles.map(value => <AccessChoice key={value} name="user-role" value={value} label={roleLabels[value]} description={roleDetails[value].description} icon={roleDetails[value].icon} checked={role === value} disabled={busy} onChange={() => change({ role: value })} />)}</div>
      </fieldset>
      <fieldset className="user-choice-section" disabled={busy}>
        <legend>Equipo de soporte</legend><p>Selecciona el equipo al que pertenecerá la cuenta.</p>
        <div className="user-team-options"><AccessChoice name="user-team" value="" label="Sin equipo" description="Sin asignación de soporte" icon={User} checked={teamId === ''} disabled={busy} onChange={() => change({ teamId: '' })} />{teams.map(team => <AccessChoice key={team.id} name="user-team" value={team.id} label={team.name} description={team.code} icon={Buildings} checked={teamId === team.id} disabled={busy} onChange={() => change({ teamId: team.id })} />)}</div>
      </fieldset>
      <div className={`user-access-state ${active ? 'is-active' : ''}`}><div><strong>Estado de acceso</strong><p>{active ? 'La cuenta puede iniciar sesión y usar sus permisos.' : 'La cuenta no podrá iniciar sesión.'}</p></div><label className="user-switch"><input type="checkbox" role="switch" aria-label="Acceso activo" checked={active} disabled={busy} onChange={event => change({ active: event.target.checked })} /><span className="user-switch-track" aria-hidden="true" /><span>{active ? 'Activo' : 'Inactivo'}</span></label></div>
      <Field label="Motivo del cambio" required hint="Quedará registrado junto con los valores anteriores y nuevos."><textarea className="input" minLength={5} maxLength={500} rows={2} value={reason} disabled={busy} onChange={event => { change({ reason: event.target.value }); setFieldError('') }} placeholder="Explica por qué actualizas este acceso…" /></Field>
      <FormError message={fieldError} />
    </div>
    <div className="modal__actions user-editor-actions"><span>{accessChanged ? 'Cambios sin guardar' : 'Selecciona los cambios que quieres aplicar'}</span><Button variant="secondary" onClick={onClose} disabled={busy}>Cancelar</Button><Button type="submit" disabled={busy || !accessChanged}>{mutation.isPending ? 'Guardando…' : 'Guardar cambios'}</Button></div>
  </form>
}

export default function UsersPage() {
  const client = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)
  const [draftSearch, setDraftSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [editorRevision, setEditorRevision] = useState(0)
  const [dirty, setDirty] = useState(false), [busy, setBusy] = useState(false), [discarding, setDiscarding] = useState(false)
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const users = useQuery({ queryKey: ['users', filters, page], queryFn: () => listUsers({ page, pageSize, search: filters.search || undefined, role: filters.role as CampusRole || undefined, active: filters.active === 'all' ? undefined : filters.active === 'active', teamId: filters.teamId || undefined }) })
  const teams = useQuery({ queryKey: ['users', 'teams'], queryFn: listTeams })
  const selected = useQuery({ queryKey: ['users', selectedId], queryFn: () => getUser(selectedId!), enabled: !!selectedId, refetchOnWindowFocus: false })

  function applyFilters(event: FormEvent) { event.preventDefault(); setPage(1); setFilters(previous => ({ ...previous, search: draftSearch.trim() })) }
  function clearFilters() { setDraftSearch(''); setFilters(initialFilters); setPage(1) }
  function selectUser(id: string, opener: HTMLButtonElement) { openerRef.current = opener; setMessage(''); setDirty(false); setSelectedId(id) }
  function closeEditor() {
    setSelectedId(null); setDirty(false); setDiscarding(false)
    requestAnimationFrame(() => { if (openerRef.current?.isConnected) openerRef.current.focus(); else searchRef.current?.focus() })
  }
  function requestClose() { if (!busy) { if (dirty) setDiscarding(true); else closeEditor() } }
  async function reloadProfile() { const result = await selected.refetch(); if (result.isSuccess) { setDirty(false); setEditorRevision(value => value + 1) } }
  function saved(user: UserItem) { client.setQueryData(['users', user.id], user); void client.invalidateQueries({ queryKey: ['users'] }); setPage(1); closeEditor(); setMessage('Cambios guardados correctamente') }
  const totalPages = users.data ? Math.max(1, Math.ceil(users.data.total / users.data.pageSize)) : 1
  const loadError = users.error || teams.error
  return <section className="users-page content-stack">
    <PageHeading title="Usuarios y roles" subtitle="Administra los roles, equipos y el acceso de las cuentas de tu institución." illustration={false} />
    {message && <Notice role="status" aria-live="polite" aria-atomic="true"><strong>{message}</strong></Notice>}
    {loadError && <Notice tone="amber" icon={WarningCircle} role="alert"><strong>No se pudo cargar la información</strong><p>{errorMessage(loadError)}</p><Button variant="ghost" onClick={() => { void users.refetch(); void teams.refetch() }}>Reintentar</Button></Notice>}
    {users.isPending || teams.isPending ? <Card><p role="status">Cargando usuarios…</p></Card> : !loadError && <>
      <Card className="users-toolbar-card"><form className="users-toolbar" onSubmit={applyFilters}>
        <label className="users-search"><MagnifyingGlass size={20} aria-hidden="true" /><input ref={searchRef} className="input" type="search" maxLength={100} aria-label="Buscar usuarios" placeholder="Buscar por nombre o correo…" value={draftSearch} onChange={event => setDraftSearch(event.target.value)} /></label>
        <Select aria-label="Filtrar por rol" value={filters.role} onChange={event => { setPage(1); setFilters(previous => ({ ...previous, role: event.target.value })) }}><option value="">Todos los roles</option>{roles.map(role => <option value={role} key={role}>{roleLabels[role]}</option>)}</Select>
        <Select aria-label="Filtrar por estado" value={filters.active} onChange={event => { setPage(1); setFilters(previous => ({ ...previous, active: event.target.value as UserStatusFilter })) }}><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></Select>
        <Select aria-label="Filtrar por equipo" value={filters.teamId} onChange={event => { setPage(1); setFilters(previous => ({ ...previous, teamId: event.target.value })) }}><option value="">Todos los equipos</option>{teams.data?.map(team => <option value={team.id} key={team.id}>{team.name}</option>)}</Select>
        <Button type="submit" icon={MagnifyingGlass}>Buscar</Button><Button variant="ghost" onClick={clearFilters}>Limpiar</Button>
      </form></Card>
      <Card className="users-list-card"><CardHeading title="Directorio de usuarios" icon={UsersThree} action={<span className="users-count">{users.data?.total ?? 0} {users.data?.total === 1 ? 'resultado' : 'resultados'}</span>} /><UserTable users={users.data?.items ?? []} onSelect={selectUser} /><div className="users-pagination"><span>Página {page} de {totalPages}</span><div><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>Siguiente</Button></div></div></Card>
    </>}
    <Modal open={!!selectedId} title="Editar acceso de usuario" className="users-modal" closeDisabled={busy} onClose={requestClose}>
      {selectedId && (selected.isPending ? <div className="modal__body"><p role="status">Cargando perfil…</p></div> : selected.error ? <div className="modal__body"><Notice tone="amber" role="alert">{errorMessage(selected.error)}</Notice><Button variant="secondary" onClick={() => void selected.refetch()}>Reintentar</Button></div> : selected.data && <AccessForm key={`${selected.data.id}:${selected.data.accessVersion}:${editorRevision}`} user={selected.data} teams={teams.data ?? []} onClose={requestClose} onSaved={saved} onDirty={setDirty} onBusy={setBusy} onReload={reloadProfile} />)}
    </Modal>
    <Modal open={discarding} title="Descartar cambios sin guardar" onClose={() => setDiscarding(false)}><div className="modal__body"><p>Los cambios de este usuario todavía no se guardaron. ¿Quieres descartarlos?</p></div><div className="modal__actions"><Button variant="secondary" onClick={() => setDiscarding(false)}>Seguir editando</Button><Button variant="danger" onClick={closeEditor}>Descartar cambios</Button></div></Modal>
  </section>
}
