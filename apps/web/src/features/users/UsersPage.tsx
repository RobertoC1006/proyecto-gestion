import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, MagnifyingGlass, UserCircle, UsersThree, WarningCircle, X } from '@phosphor-icons/react'
import { Button, Card, CardHeading, EmptyState, Field, FormError, IconBubble, Notice, Select } from '../../components/ui'
import { ApiError } from '../../lib/api/http'
import { getUser, isApiError, listTeams, listUsers, roleLabels, roles, updateUserAccess, type CampusRole, type UserItem, type UserStatusFilter } from '../../lib/api/users'
import './users.css'

const pageSize = 10
const initialFilters = { role: '', active: 'all' as UserStatusFilter, teamId: '', search: '' }
const statusLabel = (active: boolean) => active ? 'Activo' : 'Inactivo'
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la solicitud.'

function UserStatus({ active }: { active: boolean }) {
  return <span className={`user-status user-status--${active ? 'active' : 'inactive'}`}><span aria-hidden="true" />{statusLabel(active)}</span>
}

function UserTable({ users, selectedId, onSelect }: { users: UserItem[]; selectedId: string | null; onSelect: (id: string, opener: HTMLButtonElement) => void }) {
  if (!users.length) return <EmptyState title="No encontramos usuarios" description="Prueba con otros filtros o limpia la búsqueda." />
  return <div className="users-table-wrap"><table className="users-table"><caption className="sr-only">Directorio de usuarios con rol, equipo y estado de acceso.</caption><thead><tr><th>Usuario</th><th>Rol</th><th>Equipo</th><th>Estado</th><th><span className="sr-only">Acción</span></th></tr></thead><tbody>
    {users.map(user => <tr key={user.id} className={selectedId === user.id ? 'is-selected' : undefined}>
      <td><button className="user-cell" type="button" onClick={event => onSelect(user.id, event.currentTarget)}><span className="user-avatar"><UserCircle size={23} aria-hidden="true" /></span><span><strong>{user.displayName}</strong><small>{user.email}</small></span></button></td>
      <td><span className="role-label">{roleLabels[user.role]}</span></td>
      <td>{user.team ? <span><strong>{user.team.name}</strong><small className="table-subtext">{user.team.code}</small></span> : <span className="muted">Sin equipo</span>}</td>
      <td><UserStatus active={user.active} /></td>
      <td><Button variant="secondary" className="user-edit-button" onClick={event => onSelect(user.id, event.currentTarget)}>Editar</Button></td>
    </tr>)}
  </tbody></table></div>
}

function AccessPanel({ user, teams, onClose, onSaved }: { user: UserItem; teams: { id: string; code: string; name: string }[]; onClose: () => void; onSaved: (user: UserItem) => void }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const [role, setRole] = useState<CampusRole>(user.role)
  const [active, setActive] = useState(user.active)
  const [teamId, setTeamId] = useState(user.teamId ?? '')
  const [reason, setReason] = useState('')
  const [fieldError, setFieldError] = useState('')
  const mutation = useMutation({ mutationFn: () => updateUserAccess(user.id, { role, active, teamId: teamId || null, reason: reason.trim(), expectedVersion: user.accessVersion }), onSuccess: onSaved })

  useEffect(() => { closeButtonRef.current?.focus() }, [])
  useEffect(() => { setRole(user.role); setActive(user.active); setTeamId(user.teamId ?? ''); setReason(''); setFieldError(''); mutation.reset() }, [user.id, user.role, user.active, user.teamId, mutation.reset])
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || mutation.isPending || document.querySelector('dialog[open]')) return
      event.preventDefault()
      onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [mutation.isPending, onClose])

  function submit(event: FormEvent) {
    event.preventDefault()
    if (reason.trim().length < 5) { setFieldError('Escribe un motivo de al menos 5 caracteres.'); return }
    setFieldError(''); mutation.mutate()
  }

  const apiError = mutation.error
  const conflict = isApiError(apiError) && apiError.code === 'CONFLICT'
  const lastAdmin = isApiError(apiError) && apiError.code === 'LAST_ADMINISTRATOR'
  return <aside className="user-access-panel" aria-label="Editar acceso de usuario">
    <div className="user-panel-heading"><div><span className="eyebrow">Perfil seleccionado</span><h2>{user.displayName}</h2><p>{user.email}</p></div><button ref={closeButtonRef} className="icon-button" type="button" aria-label="Cerrar edición" onClick={onClose}><X size={21} /></button></div>
    <div className="user-panel-summary"><span className="user-avatar user-avatar--large"><UserCircle size={30} aria-hidden="true" /></span><div><strong>{roleLabels[user.role]}</strong><UserStatus active={user.active} /></div></div>
    {apiError && <Notice tone="amber" icon={WarningCircle} role="alert"><strong>{conflict ? 'El acceso cambió' : lastAdmin ? 'No se puede retirar el último administrador' : 'No se pudo guardar el acceso'}</strong><p>{errorMessage(apiError)}</p></Notice>}
    <form className="user-access-form" onSubmit={submit}>
      <Field label="Rol" required><Select value={role} disabled={mutation.isPending} onChange={event => setRole(event.target.value as CampusRole)}>{roles.map(value => <option value={value} key={value}>{roleLabels[value]}</option>)}</Select></Field>
      <Field label="Equipo de soporte"><Select value={teamId} disabled={mutation.isPending} onChange={event => setTeamId(event.target.value)}><option value="">Sin equipo</option>{teams.map(team => <option value={team.id} key={team.id}>{team.name} · {team.code}</option>)}</Select></Field>
      <Field label="Estado" required><Select value={active ? 'active' : 'inactive'} disabled={mutation.isPending} onChange={event => setActive(event.target.value === 'active')}><option value="active">Activo</option><option value="inactive">Inactivo</option></Select></Field>
      <Field label="Motivo del cambio" required hint="Se conservará junto con los valores anteriores y nuevos."><textarea className="input" minLength={5} maxLength={500} rows={4} value={reason} disabled={mutation.isPending} onChange={event => { setReason(event.target.value); setFieldError('') }} /></Field>
      <FormError message={fieldError} />
      <div className="user-panel-actions"><Button variant="secondary" onClick={onClose} disabled={mutation.isPending}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Guardando…' : 'Guardar cambios'}</Button></div>
    </form>
  </aside>
}

export default function UsersPage() {
  const client = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)
  const [draftSearch, setDraftSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const openerRef = useRef<HTMLButtonElement | null>(null)
  const users = useQuery({ queryKey: ['users', filters, page], queryFn: () => listUsers({ page, pageSize, search: filters.search || undefined, role: filters.role as CampusRole || undefined, active: filters.active === 'all' ? undefined : filters.active === 'active', teamId: filters.teamId || undefined }) })
  const teams = useQuery({ queryKey: ['users', 'teams'], queryFn: listTeams })
  const selected = useQuery({ queryKey: ['users', selectedId], queryFn: () => getUser(selectedId!), enabled: !!selectedId })

  function applyFilters(event?: FormEvent) { event?.preventDefault(); setPage(1); setFilters(previous => ({ ...previous, search: draftSearch.trim() })) }
  function clearFilters() { setDraftSearch(''); setFilters(initialFilters); setPage(1) }
  function selectUser(id: string, opener: HTMLButtonElement) { openerRef.current = opener; setMessage(''); setSelectedId(id) }
  function closePanel() { setSelectedId(null); requestAnimationFrame(() => openerRef.current?.focus()) }
  function saved(user: UserItem) { void client.invalidateQueries({ queryKey: ['users'] }); client.setQueryData(['users', user.id], user); setSelectedId(null); setMessage('Cambios guardados correctamente'); requestAnimationFrame(() => openerRef.current?.focus()) }
  const totalPages = users.data ? Math.max(1, Math.ceil(users.data.total / users.data.pageSize)) : 1
  const loadError = users.error || teams.error
  return <section className="users-page content-stack">
    <div className="users-heading"><div><span className="eyebrow">Administración institucional</span><h1>Usuarios y roles</h1><p>Administra perfiles, equipos y estado de acceso desde una única fuente autorizada.</p></div><div className="users-heading-icon"><UsersThree size={32} aria-hidden="true" /></div></div>
    {message && <Notice role="status" aria-live="polite" aria-atomic="true"><strong>{message}</strong></Notice>}
    {loadError && <Notice tone="amber" icon={WarningCircle} role="alert"><strong>No se pudo cargar la información</strong><p>{errorMessage(loadError)}</p><Button variant="ghost" onClick={() => { void users.refetch(); void teams.refetch() }}>Reintentar</Button></Notice>}
    {users.isPending ? <Card><p role="status">Cargando usuarios…</p></Card> : !loadError && <>
      <Card className="users-toolbar-card"><form className="users-toolbar" onSubmit={applyFilters}><label className="users-search"><MagnifyingGlass size={20} aria-hidden="true" /><input className="input" type="search" aria-label="Buscar usuarios" placeholder="Buscar por nombre o correo…" value={draftSearch} onChange={event => setDraftSearch(event.target.value)} /></label><Select aria-label="Filtrar por rol" value={filters.role} onChange={event => { setPage(1); setFilters(previous => ({ ...previous, role: event.target.value })) }}><option value="">Todos los roles</option>{roles.map(role => <option value={role} key={role}>{roleLabels[role]}</option>)}</Select><Select aria-label="Filtrar por estado" value={filters.active} onChange={event => { setPage(1); setFilters(previous => ({ ...previous, active: event.target.value as UserStatusFilter })) }}><option value="all">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></Select><Select aria-label="Filtrar por equipo" value={filters.teamId} onChange={event => { setPage(1); setFilters(previous => ({ ...previous, teamId: event.target.value })) }}><option value="">Todos los equipos</option>{teams.data?.map(team => <option value={team.id} key={team.id}>{team.name}</option>)}</Select><Button type="submit" icon={MagnifyingGlass}>Buscar</Button><Button variant="ghost" onClick={clearFilters}>Limpiar</Button></form></Card>
      <div className="users-content-grid"><Card className="users-list-card"><CardHeading title="Directorio de usuarios" icon={UsersThree} action={<span className="users-count">{users.data?.total ?? 0} resultados</span>} /><UserTable users={users.data?.items ?? []} selectedId={selectedId} onSelect={selectUser} /><div className="users-pagination"><span>Página {page} de {totalPages}</span><div><Button variant="secondary" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Anterior</Button><Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>Siguiente</Button></div></div></Card>{selected.data && <AccessPanel user={selected.data} teams={teams.data ?? []} onClose={closePanel} onSaved={saved} />}{selected.isPending && <Card className="user-panel-loading"><p role="status">Cargando perfil…</p></Card>}{selected.error && <Notice tone="amber" role="alert">{errorMessage(selected.error)}</Notice>}</div>
    </>}
    {!users.isPending && !loadError && <Notice icon={CheckCircle}><strong>Acceso protegido</strong><p>Los cambios se validan en el servidor y se registran con el motivo indicado.</p></Notice>}
  </section>
}