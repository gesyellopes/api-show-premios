import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateTicketLogsTable extends BaseSchema {
  protected tableName = 'ticket_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.bigInteger('tenant_id').unsigned().notNullable().index()
      table.bigInteger('event_id').unsigned().nullable().index()

      table.string('ticket_number', 50).nullable().index()
      table.string('action', 50).notNullable().index()

      table.bigInteger('unit_id').unsigned().nullable().index()
      table.bigInteger('group_id').unsigned().nullable().index()
      table.bigInteger('vendor_id').unsigned().nullable().index()

      // Log estruturado (payload, detalhes, diff, etc.)
      table.json('log').nullable()

      table.datetime('created_at').notNullable()
      table.datetime('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
