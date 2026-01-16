import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddTicketNumberToTickets extends BaseSchema {
  protected tableName = 'ticket_returns'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {

      table.bigInteger('tenant_id').unsigned().notNullable().index().after('id')
      table.bigInteger('event_id').unsigned().nullable().index().after('tenant_id')
      table.bigInteger('group_id').unsigned().nullable().index().after('unit_id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ticket_number')
    })
  }
}
