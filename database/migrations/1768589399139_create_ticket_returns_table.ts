import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateTicketReturnsTable extends BaseSchema {
  protected tableName = 'ticket_returns'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.bigInteger('unit_id').unsigned().notNullable().index()

      table.string('ticket_from', 50).notNullable().index()
      table.string('ticket_to', 50).notNullable().index()

      table.integer('total').unsigned().notNullable()

      table.text('reason').nullable()

      table.datetime('created_at').notNullable()
      table.datetime('updated_at').notNullable()

      // opcional: ajuda a evitar duplicidade exata de range dentro da mesma unidade
      //table.unique(['unit_id', 'ticket_from', 'ticket_to'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
