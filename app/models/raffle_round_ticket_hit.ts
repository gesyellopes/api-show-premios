import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class RaffleRoundTicketHit extends BaseModel {
  public static table = 'raffle_round_ticket_hits'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tenant_id' })
  declare tenantId: number

  @column({ columnName: 'raffle_id' })
  declare raffleId: number

  @column({ columnName: 'round_id' })
  declare roundId: number

  @column({ columnName: 'ticket_id' })
  declare ticketId: number

  @column({ columnName: 'ticket_number' })
  declare ticketNumber: string | null

  @column({ columnName: 'hits_count' })
  declare hitsCount: number

  @column({ columnName: 'last_called_number' })
  declare lastCalledNumber: number | null

  @column.dateTime({ columnName: 'last_hit_at' })
  declare lastHitAt: DateTime | null

  @column({ columnName: 'is_winner' })
  declare isWinner: boolean

  @column.dateTime({ columnName: 'won_at' })
  declare wonAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
