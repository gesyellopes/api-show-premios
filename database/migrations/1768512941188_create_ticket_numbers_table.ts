// database/migrations/xxxxxx_create_ticket_numbers_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class CreateTicketNumbersTable extends BaseSchema {
  protected tableName = 'ticket_numbers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.bigIncrements('id')

      table.bigInteger('tenant_id').unsigned().notNullable().index()
      table.bigInteger('ticket_id').unsigned().notNullable().index()

      // AJUDE
      table.enu('letter', ['A', 'J', 'U', 'D', 'E']).notNullable().index()

      // 1..4 (posição dentro da letra)
      table.integer('position').unsigned().notNullable()

      // 1..75
      table.integer('value').unsigned().notNullable().index()

      table.dateTime('created_at').notNullable()
      table.dateTime('updated_at').notNullable()

      /**
       * Integridade do layout:
       * - um ticket não pode ter duas entradas na mesma letra/posição
       */
      table.unique(['ticket_id', 'letter', 'position'], {
        indexName: 'uq_ticket_letter_position',
      })

      /**
       * Regra de negócio:
       * - dentro de cada letra, os valores não se repetem no mesmo ticket
       */
      table.unique(['ticket_id', 'letter', 'value'], {
        indexName: 'uq_ticket_letter_value',
      })

      /**
       * Performance:
       * - lookup rápido: "quem tem o número X na letra Y" (filtrado por tenant)
       */
      table.index(['tenant_id', 'letter', 'value'], 'idx_tenant_letter_value')

      /**
       * CHECKs (MySQL 8+):
       * - ajudam a travar erro no banco. Se seu MySQL for antigo, ele pode ignorar.
       */
      table.check('position BETWEEN 1 AND 4', undefined, 'chk_ticket_numbers_position_1_4')
      table.check('value BETWEEN 1 AND 75', undefined, 'chk_ticket_numbers_value_1_75')

      // Se quiser travar o range por letra no banco (MySQL 8+), use RAW:
      // table.raw(`
      //   ALTER TABLE ticket_numbers
      //   ADD CONSTRAINT chk_ticket_numbers_letter_range CHECK (
      //     (letter='A' AND value BETWEEN 1 AND 15) OR
      //     (letter='J' AND value BETWEEN 16 AND 30) OR
      //     (letter='U' AND value BETWEEN 31 AND 45) OR
      //     (letter='D' AND value BETWEEN 46 AND 60) OR
      //     (letter='E' AND value BETWEEN 61 AND 75)
      //   )
      // `)

      /**
       * FKs (opcional — só liga se suas tabelas existirem e estiverem consistentes)
       *
       * table
       *   .foreign('ticket_id')
       *   .references('tickets.id')
       *   .onDelete('CASCADE')
       *
       * table
       *   .foreign('tenant_id')
       *   .references('tenants.id')
       *   .onDelete('CASCADE')
       */
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
