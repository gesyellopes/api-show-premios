import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Otp extends BaseModel {
  static table = 'otps'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @column()
  declare whatsapp: string

  @column({ columnName: 'code_hash', serializeAs: null })
  declare codeHash: string

  @column({ columnName: 'expires_at' })
  declare expiresAt: DateTime | string

  @column({ columnName: 'consumed_at' })
  declare consumedAt: DateTime | null

  @column()
  declare attempts: number

  @column({ columnName: 'max_attempts' })
  declare maxAttempts: number

  @column()
  declare purpose: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
