// database/migrations/xxxxxx_create_raffles_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRafflesTable extends BaseSchema {
  protected tableName = 'raffles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.bigInteger('tenant_id').unsigned().notNullable().index()
      table.bigInteger('event_id').unsigned().notNullable().index()

      table.string('name', 150).notNullable()

      // Status do Raffle
      // draft | active | completed | canceled | test
      table
        .enu('status', ['draft', 'active', 'completed', 'canceled', 'test'])
        .notNullable()
        .defaultTo('draft')
        .index()

      // Data oficial do evento / sorteio
      table.dateTime('event_date').notNullable().index()

      // Regras do sorteio (futuro)
      table.text('ruleset').nullable()

      table.datetime('created_at').notNullable()
      table.datetime('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}