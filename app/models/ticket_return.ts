import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TicketReturn extends BaseModel {
  public static table = 'ticket_returns'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare eventId: number

  @column()
  declare unitId: number

  @column()
  declare groupId: number

  @column()
  declare ticketFrom: string

  @column()
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
