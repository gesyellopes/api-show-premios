import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class QrReadError extends BaseModel {
  static table = 'qr_read_errors'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'sent_by' })
  declare sentBy: string

  @column.dateTime({ columnName: 'sent_at' })
  declare sentAt: DateTime

  @column()
  declare file: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
