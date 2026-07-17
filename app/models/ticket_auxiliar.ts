import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TicketAuxiliar extends BaseModel {
  static connection = 'secondary'
  static table = 'tickets_rodeio'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'ticket_number' })
  declare ticketNumber: string

  @column({ columnName: 'message_id' })
  declare messageId: string | null

  @column()
  declare validated: boolean

  @column.dateTime({ columnName: 'validated_on' })
  declare validatedOn: DateTime | null

  @column({ columnName: 'ticket_mirror' })
  declare ticketMirror: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime
}
