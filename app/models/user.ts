import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['whatsapp'],              // ✅ login por whatsapp
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  static table = 'users'           // ✅ garante nome da tabela

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare whatsapp: string

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare role: string | null

  // ✅ no banco é tenant_id (snake_case). No TS usamos tenantId
  @column({ columnName: 'tenant_id' })
  declare tenantId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
