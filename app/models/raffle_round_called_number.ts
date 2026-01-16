import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RaffleRoundCalledNumber extends BaseModel {
  public static table = 'raffle_round_called_numbers'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare raffleId: number

  @column()
  declare roundId: number

  // número da bola sorteada (1..75)
  @column()
  declare number: number

  // ordem em que a bola foi chamada (1, 2, 3...)
  @column()
  declare drawOrder: number

  @column.dateTime()
  declare drawnAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * TODO (future):
   * Relations (optional)
   *
   * - belongsTo round (raffle_rounds.id)
   * - belongsTo raffle (raffles.id)
   */
}
