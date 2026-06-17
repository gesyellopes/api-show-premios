import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TicketAuxiliarTable extends BaseModel {
  static connection = 'secondary'
  static table = 'tickets'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column({ columnName: 'event_id' })
  declare eventId: number

  @column({ columnName: 'agent_id' })
  declare agentId: number | null

  @column({ columnName: 'dealer_id' })
  declare dealerId: number | null

  @column({ columnName: 'distributor_id' })
  declare distributorId: number | null

  @column({ columnName: 'ticket_number' })
  declare ticketNumber: string

  @column()
  declare status: string

  @column({ columnName: 'message_id' })
  declare messageId: string | null

  @column.dateTime({ columnName: 'validated_at' })
  declare validatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null
}
