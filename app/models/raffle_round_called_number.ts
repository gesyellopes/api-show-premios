import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RaffleRoundCalledNumber extends BaseModel {
  public static table = 'raffle_round_called_numbers'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tenant_id' })
  declare tenantId: number

  @column({ columnName: 'raffle_id' })
  declare raffleId: number

  @column({ columnName: 'round_id' })
  declare roundId: number

  @column()
  declare number: number

  @column({ columnName: 'draw_order' })
  declare drawOrder: number

  @column.dateTime({ columnName: 'drawn_at' })
  declare drawnAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
