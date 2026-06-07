import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class TicketWhatsappMessage extends BaseModel {
  static connection = 'secondary'
  static table = 'ticket_whatsapp_messages'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'message_id' })
  declare messageId: string

  @column({ columnName: 'sender_number' })
  declare senderNumber: string

  @column({ columnName: 'sender_name' })
  declare senderName: string

  @column.dateTime({ columnName: 'sent_at' })
  declare sentAt: DateTime | null

  @column({ columnName: 'whatsapp_message_id' })
  declare whatsappMessageId: string

  @column()
  declare attempts: number

  @column()
  declare filename: string | null

  @column({ columnName: 'ticket_number' })
  declare ticketNumber: string

  @column()
  declare status: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoUpdate: true })
  declare updatedAt: DateTime

  @column.dateTime()
  declare deletedAt: DateTime | null
}
