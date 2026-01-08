import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class Unit extends BaseModel {
  static table = 'unit'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column({ columnName: 'organization_id' })
  declare organizationId: number

  @column({ columnName: 'manager_id' })
  declare managerId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
