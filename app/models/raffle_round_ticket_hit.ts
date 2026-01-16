import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RaffleRoundTicketHit extends BaseModel {
  public static table = 'raffle_round_ticket_hits'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare raffleId: number

  @column()
  declare roundId: number

  @column()
  declare ticketId: number

  // acertos acumulados (0..20)
  @column()
  declare hitsCount: number

  // auditoria
  @column()
  declare lastCalledNumber: number | null

  @column.dateTime()
  declare lastHitAt: DateTime | null

  // winner
  @column()
  declare isWinner: boolean

  @column.dateTime()
  declare wonAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * TODO (future):
   * Relations (optional)
   *
   * - belongsTo round (raffle_rounds.id)
   * - belongsTo ticket (tickets.id)
   * - belongsTo raffle (raffles.id)
   */
}
