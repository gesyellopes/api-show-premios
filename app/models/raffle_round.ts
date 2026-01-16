import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type RaffleRoundStatus = 'scheduled' | 'running' | 'closed' | 'void'

export default class RaffleRound extends BaseModel {
  public static table = 'raffle_rounds'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare raffleId: number

  @column()
  declare description: string | null

  @column()
  declare roundNumber: number

  @column()
  declare status: RaffleRoundStatus

  @column()
  declare prize: string | null

  @column()
  declare ticketsCount: number | null

  @column.dateTime()
  declare startAt: DateTime | null

  @column.dateTime()
  declare decidedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * TODO (future):
   * Relations (optional)
   *
   * - belongsTo raffle (raffles.id)
   * - hasMany calledNumbers (raffle_round_called_numbers.round_id)
   * - hasMany hits (raffle_round_ticket_hits.round_id)
   * - manyToMany tickets via raffle_rounds_tickets
   */
}
