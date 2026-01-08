import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Group extends BaseModel {
  static table = 'group' // ✅ sua tabela chama "group"

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ columnName: 'unit_id' })
  declare unitId: number

  @column({ columnName: 'manager_id' })
  declare managerId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
