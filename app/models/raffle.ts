import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type RaffleStatus = 'draft' | 'active' | 'completed' | 'canceled' | 'test'

export default class Raffle extends BaseModel {
  public static table = 'raffles'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tenant_id' })
  declare tenantId: number

  @column({ columnName: 'event_id' })
  declare eventId: number

  @column()
  declare name: string

  @column()
  declare status: RaffleStatus

  @column.dateTime({ columnName: 'event_date' })
  declare eventDate: DateTime

  @column()
  declare ruleset: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
