import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RaffleRoundTicket extends BaseModel {
  public static table = 'raffle_round_tickets'

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

  @column()
  declare ticketNumber: string

  // se o ticket é elegível para este round
  @column()
  declare eligible: boolean

  @column()
  declare ineligibleReason: string | null

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
