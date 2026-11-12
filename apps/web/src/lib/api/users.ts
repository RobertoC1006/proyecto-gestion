import { request, type ApiError } from './http'

import type { components, operations } from './schema'
import { roleLabels } from '../../features/auth/AuthContext'

export { roleLabels }
export type UserItem = components['schemas']['UserItemDto']
export type CampusRole = UserItem['role']
export type UserStatusFilter = 'all' | 'active' | 'inactive'
export type SupportTeam = components['schemas']['SupportTeamItemDto']
export type UsersPage = components['schemas']['UsersPageDto']
export type UsersQuery = NonNullable<operations['UsersController_listUsers']['parameters']['query']>
export type UpdateUserAccess = components['schemas']['UpdateUserAccessDto']
export const roles = Object.keys(roleLabels) as CampusRole[]

export async function listUsers(query: UsersQuery): Promise<UsersPage> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), pageSize: String(query.pageSize ?? 20) })
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