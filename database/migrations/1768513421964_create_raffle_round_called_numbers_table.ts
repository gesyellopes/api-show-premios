// database/migrations/xxxxxx_create_raffle_round_draws_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRaffleRoundDrawsTable extends BaseSchema {
  protected tableName = 'raffle_round_draws'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.bigInteger('tenant_id').unsigned().notNullable().index()
      table.bigInteger('raffle_id').unsigned().notNullable().index()
      table.bigInteger('round_id').unsigned().notNullable().index()

      // bola sorteada: 1..75
      table.integer('number').unsigned().notNullable()

      // ordem em que saiu (1,2,3...)
      table.integer('draw_order').unsigned().notNullable()

      table.dateTime('drawn_at').notNullable().index()

      table.dateTime('created_at').notNullable()
      table.dateTime('updated_at').notNullable()

      // não deixa repetir a mesma bola no mesmo round
      table.unique(['round_id', 'number'], { indexName: 'uq_round_number' })

      // não deixa repetir a mesma ordem
      table.unique(['round_id', 'draw_order'], { indexName: 'uq_round_order' })

      // check básico (MySQL 8+)
      table.check('number BETWEEN 1 AND 75', undefined, 'chk_round_draw_number_1_75')

      // performance: round + ordem
      table.index(['round_id', 'draw_order'], 'idx_round_draw_order')
      table.index(['tenant_id', 'round_id', 'number'], 'idx_tenant_round_number')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
