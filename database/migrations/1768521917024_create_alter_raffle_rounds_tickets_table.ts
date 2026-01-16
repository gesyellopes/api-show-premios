import { BaseSchema } from '@adonisjs/lucid/schema'

export default class AddTicketNumberToTickets extends BaseSchema {
  protected tableName = 'raffle_round_tickets'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('ticket_number', 50).nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('ticket_number')
    })
  }
}
