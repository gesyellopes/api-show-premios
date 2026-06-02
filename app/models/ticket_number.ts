import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type TicketLetter = 'A' | 'J' | 'U' | 'D' | 'E'

export default class TicketNumber extends BaseModel {
  public static table = 'ticket_numbers'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tenant_id' })
  declare tenantId: number

  @column({ columnName: 'ticket_id' })
  declare ticketId: number

  @column({ columnName: 'ticket_number' })
  declare ticketNumber: string | null

  @column()
  declare letter: TicketLetter

  @column()
  declare position: number

  @column()
  declare value: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
