import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type TicketLogAction =
  | 'ticket_assigned'
  | 'ticket_returned'
  | 'ticket_verified'
  | 'ticket_voided'
  | 'ticket_updated'

export default class TicketLog extends BaseModel {
  public static table = 'ticket_logs'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare eventId: number | null

  @column()
  declare ticketNumber: string | null

  @column()
  declare action: TicketLogAction

  @column()
  declare unitId: number | null

  @column()
  declare groupId: number | null

  @column()
  declare vendorId: number | null

  // JSON livre: { message, before, after, payload, ip, user_agent, ... }
  @column()
  declare log: any | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
