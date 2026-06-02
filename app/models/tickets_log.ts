import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TicketsLog extends BaseModel {
  static table = 'tickets_log'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'ticket_id' })
  declare ticketId: number | null

  @column({ columnName: 'ticket_number' })
  declare ticketNumber: string | null

  @column({ columnName: 'event_id' })
  declare eventId: number | null

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column.dateTime()
  declare date: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
