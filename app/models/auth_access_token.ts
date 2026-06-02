import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class AuthAccessToken extends BaseModel {
  static table = 'auth_access_tokens'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'tokenable_id' })
  declare tokenableId: number

  @column()
  declare type: string

  @column()
  declare name: string | null

  @column({ serializeAs: null })
  declare hash: string

  @column()
  declare abilities: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime | null

  @column({ columnName: 'last_used_at' })
  declare lastUsedAt: DateTime | null

  @column({ columnName: 'expires_at' })
  declare expiresAt: DateTime | null
}
