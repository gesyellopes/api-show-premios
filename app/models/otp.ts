import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Otp extends BaseModel {
  static table = 'otps'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column()
  declare whatsapp: string

  @column({ columnName: 'code_hash', serializeAs: null })
  declare codeHash: string

  @column.dateTime({ columnName: 'expires_at' })
  declare expiresAt: DateTime

  @column.dateTime({ columnName: 'consumed_at' })
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
