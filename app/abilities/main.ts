import { Bouncer } from '@adonisjs/bouncer'
import User from '#models/user'

export const access = Bouncer.ability((user: User, permission: string) => {
  // Lógica de Super Admin (recomendado pela doc fazer dentro da ability ou no .before() de classe)
  if (user.role === 'super_admin') return true

  const acl = {
    manager: [
      'update_ticket',
      'delete_ticket',
      'view_all_tickets'
    ],
    support: [
      'update_ticket',
      'view_all_tickets'
    ],
    client: [
      'view_ticket'
    ],
    vendor: [
      'view_ticket'
    ]
  }

  const userRole = user.role as keyof typeof acl
  return acl[userRole]?.includes(permission) ?? false
})