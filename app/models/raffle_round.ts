import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type RaffleRoundStatus = 'scheduled' | 'running' | 'closed' | 'void'

export default class RaffleRound extends BaseModel {
  public static table = 'raffle_rounds'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'raffle_id' })
  declare raffleId: number

  @column()
  declare description: string | null

  @column({ columnName: 'round_number' })
  declare roundNumber: number

  @column()
  declare status: RaffleRoundStatus

  @column()
  declare prize: string | null

  @column({ columnName: 'tickets_count' })
  declare ticketsCount: number | null

  @column.dateTime({ columnName: 'start_at' })
  declare startAt: DateTime | null

  @column.dateTime({ columnName: 'decided_at' })
  declare decidedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
