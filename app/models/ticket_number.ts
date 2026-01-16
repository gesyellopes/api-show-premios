import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type TicketLetter = 'A' | 'J' | 'U' | 'D' | 'E'

export default class TicketNumber extends BaseModel {
  public static table = 'ticket_numbers'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare ticketId: number

  // AJUDE
  @column()
  declare letter: TicketLetter

  // 1..4 (posição dentro da letra)
  @column()
  declare position: number

  // 1..75
  @column()
  declare value: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * TODO (future):
   * Relations (optional)
   *
   * - belongsTo ticket (tickets.id)
   */
}
