// database/migrations/xxxxxx_create_raffle_round_entries_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRaffleRoundTicketsTable extends BaseSchema {
  protected tableName = 'raffle_round_tickets'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.bigInteger('raffle_id').unsigned().notNullable().index()
      table.bigInteger('round_id').unsigned().notNullable().index()
      table.bigInteger('ticket_id').unsigned().notNullable().index()

      // opcional mas MUITO útil pra auditoria/regra de negócio
      table.boolean('eligible').notNullable().defaultTo(true)
      table.string('ineligible_reason', 255).nullable()

      table.dateTime('created_at').notNullable()
      table.dateTime('updated_at').notNullable()

      // não deixa o mesmo ticket entrar duas vezes no mesmo round
      table.unique(['round_id', 'ticket_id'])

      // índice composto pra consultas comuns (listar tickets do round)
      table.index(['round_id', 'ticket_id'])

      // índice composto pra validação rápida (ticket participa de qual round)
      table.index(['ticket_id', 'round_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
