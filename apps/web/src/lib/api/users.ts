import { request, type ApiError } from './http'

export type CampusRole = 'estudiante' | 'docente' | 'ti_agente' | 'ti_supervisor' | 'administrador'
export type UserStatusFilter = 'all' | 'active' | 'inactive'

export type SupportTeam = {
  id: string
  code: string
  name: string
}

export type UserItem = {
  id: string
  institutionId: string
  email: string
  displayName: string
  role: CampusRole
  active: boolean
  teamId: string | null
  team: SupportTeam | null
  accessVersion: number
  createdAt: string
  updatedAt: string
}

export type UsersPage = {
  items: UserItem[]
  total: number
  page: number
  pageSize: number
}

export type UsersQuery = {
  page: number
  pageSize: number
  role?: CampusRole
  active?: boolean
  teamId?: string
  search?: string
}

export type UpdateUserAccess = {
  role: CampusRole
  active: boolean
  teamId: string | null
  reason: string
  expectedVersion: number
}

export const roleLabels: Record<CampusRole, string> = {
  estudiante: 'Estudiante',
  docente: 'Docente',
  ti_agente: 'Agente TI',
  ti_supervisor: 'Supervisor TI',
  administrador: 'Administrador',
}

export const roles: CampusRole[] = ['estudiante', 'docente', 'ti_agente', 'ti_supervisor', 'administrador']

export async function listUsers(query: UsersQuery): Promise<UsersPage> {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(query.pageSize) })
  if (query.role) params.set('role', query.role)
  if (query.active !== undefined) params.set('active', String(query.active))
  if (query.teamId) params.set('teamId', query.teamId)
  if (query.search) params.set('search', query.search)
  return request<UsersPage>(`users?${params.toString()}`)
}

export function listTeams() {
  return request<SupportTeam[]>('users/teams')
}

export function getUser(id: string) {
  return request<UserItem>(`users/${id}`)
}

export function updateUserAccess(id: string, input: UpdateUserAccess) {
  return request<UserItem>(`users/${id}/access`, { method: 'PATCH', body: JSON.stringify(input) })
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof Error && 'status' in error && 'code' in error
}