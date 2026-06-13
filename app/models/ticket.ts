import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Ticket extends BaseModel {
  static connection = 'secondary'
  static table = 'tickets_pirapora'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'ticket_number' })
  declare ticketNumber: string

  @column({ columnName: 'event_id' })
  declare eventId: number | null

  @column({ columnName: 'organization_id' })
  declare organizationId: number | null

  @column({ columnName: 'unit_id' })
  declare unitId: number | null

  @column({ columnName: 'group_id' })
  declare groupId: number | null

  @column({ columnName: 'vendor_id' })
  declare vendorId: number | null

  @column.dateTime({ columnName: 'delivered_on' })
  declare deliveredOn: DateTime | null

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
