import type { CurrentUser } from './AuthContext'

// La API entrega las capacidades efectivas; el navegador no asigna roles.
export const access = {
  personalCalendar: ['academic:read:self'],
  manageCalendar: ['academic:manage'],
  personalTickets: ['tickets:read:self'],
  createTicket: ['tickets:create'],
  certificates: ['certificates:request:self'],
  teamTickets: ['tickets:read:team'],
  reports: ['reports:read:team', 'reports:read:institution'],
  users: ['users:manage'],
  permissions: ['permissions:manage'],
  configuration: ['configuration:manage'],
  audit: ['audit:read:institution'],
  privacy: ['audit:read:institution'],
} as const

export function hasAccess(user: CurrentUser | null, permissions: readonly string[]) {
  return !!user?.active && permissions.some(permission => user.permissions.includes(permission))
}

export const HOME_PATH = '/'
