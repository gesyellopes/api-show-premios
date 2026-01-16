import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export type RaffleStatus = 'draft' | 'active' | 'completed' | 'canceled' | 'test'

export default class Raffle extends BaseModel {
  public static table = 'raffles'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare tenantId: number

  @column()
  declare eventId: number

  @column()
  declare name: string

  @column()
  declare status: RaffleStatus

  @column.dateTime()
  declare eventDate: DateTime

  @column()
  declare ruleset: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  /**
   * TODO (future):
   * Relations (optional)
   *
   * - hasMany rounds (raffle_rounds.raffle_id)
   *
   * Example:
   * import { hasMany } from '@adonisjs/lucid/orm'
   * import type { HasMany } from '@adonisjs/lucid/types/relations'
   * import RaffleRound from '#models/raffle_round'
   *
   * @hasMany(() => RaffleRound, { foreignKey: 'raffleId' })
   * declare rounds: HasMany<typeof RaffleRound>
   */
}
