// app/models/whatsapp_allowed_number.ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class WhatsappAllowedNumber extends BaseModel {
  static table = 'whatsapp_allowed_numbers'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'whatsapp_number' })
  declare whatsappNumber: string

  @column({ columnName: 'user_id' })
  declare userId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}