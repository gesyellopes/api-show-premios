// database/migrations/xxxxxx_create_raffle_round_ticket_hits_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateRaffleRoundTicketHitsTable extends BaseSchema {
  protected tableName = 'raffle_round_ticket_hits'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.bigInteger('tenant_id').unsigned().notNullable().index()
      table.bigInteger('raffle_id').unsigned().notNullable().index()
      table.bigInteger('round_id').unsigned().notNullable().index()
      table.bigInteger('ticket_id').unsigned().notNullable().index()

      // quantos acertos esse ticket já acumulou neste round
      table.integer('hits_count').unsigned().notNullable().defaultTo(0).index()

      // última bola que gerou hit (auditoria)
      table.integer('last_called_number').unsigned().nullable().index()
      table.dateTime('last_hit_at').nullable().index()

      // winner
      table.boolean('is_winner').notNullable().defaultTo(false).index()
      table.dateTime('won_at').nullable().index()

      table.dateTime('created_at').notNullable()
      table.dateTime('updated_at').notNullable()

      // 1 linha por ticket por round (garantia + UPSERT)
      table.unique(['round_id', 'ticket_id'], { indexName: 'uq_round_ticket' })

      // leaderboard e consultas rápidas
      table.index(['round_id', 'hits_count'], 'idx_round_hitscount')

      // achar winners rápido
      table.index(['round_id', 'is_winner'], 'idx_round_iswinner')
      table.index(['round_id', 'is_winner', 'won_at'], 'idx_round_iswinner_wonat')

      // checks (MySQL 8+)
      table.check('hits_count BETWEEN 0 AND 20', undefined, 'chk_hits_count_0_20')
      table.check('last_called_number BETWEEN 1 AND 75', undefined, 'chk_last_called_number_1_75')

      // Consistência lógica opcional (MySQL 8+):
      // se is_winner = 1, won_at não pode ser null
      table.check(
        '(is_winner = 0 AND won_at IS NULL) OR (is_winner = 1 AND won_at IS NOT NULL)',
        undefined,
        'chk_winner_requires_won_at'
      )
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
