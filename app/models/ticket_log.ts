import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TicketLog extends BaseModel {
  public static table = 'ticket_logs'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tenant_id' })
  declare tenantId: number

  @column({ columnName: 'event_id' })
  declare eventId: number | null

  @column({ columnName: 'ticket_number' })
  declare ticketNumber: string | null

  @column()
  declare action: string

  @column({ columnName: 'unit_id' })
  declare unitId: number | null

  @column({ columnName: 'group_id' })
  declare groupId: number | null

  @column({ columnName: 'vendor_id' })
  declare vendorId: number | null

  @column()
  declare log: any | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
