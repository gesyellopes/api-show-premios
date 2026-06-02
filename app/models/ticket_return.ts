import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TicketReturn extends BaseModel {
  public static table = 'ticket_returns'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tenant_id' })
  declare tenantId: number

  @column({ columnName: 'event_id' })
  declare eventId: number | null

  @column({ columnName: 'unit_id' })
  declare unitId: number

  @column({ columnName: 'ticket_from' })
  declare ticketFrom: string

  @column({ columnName: 'ticket_to' })
  declare ticketTo: string

  @column()
  declare total: number

  @column()
  declare reason: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
