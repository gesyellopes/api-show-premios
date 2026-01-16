// database/migrations/xxxxxx_create_raffle_rounds_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRaffleRoundsTable extends BaseSchema {
  protected tableName = 'raffle_rounds'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.bigInteger('raffle_id').unsigned().notNullable().index()

      table.text('description').nullable()

      table.integer('round_number').unsigned().notNullable()

      table
        .enu('status', ['scheduled', 'running', 'closed', 'void'])
        .notNullable()
        .defaultTo('scheduled')
        .index()

      table.text('prize').nullable()

      // cache/denormalização pra performance (você atualiza quando quiser)
      table.integer('tickets_count').unsigned().nullable()

      table.dateTime('start_at').nullable().index()
      table.dateTime('decided_at').nullable().index()

      table.dateTime('created_at').notNullable()
      table.dateTime('updated_at').notNullable()

      // Evita duplicar número da rodada dentro do mesmo raffle
      table.unique(['raffle_id', 'round_number'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
