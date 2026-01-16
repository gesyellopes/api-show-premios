import { BaseSchema } from '@adonisjs/lucid/schema'
import Database from '@adonisjs/lucid/services/db'

export default class MoveTicketNumberAfterTicketId extends BaseSchema {
  protected tableName = 'raffle_round_tickets'

  async up() {
    await Database.rawQuery(`
      ALTER TABLE raffle_round_tickets
      MODIFY ticket_number VARCHAR(50) NULL
      AFTER ticket_id
    `)
  }

  async down() {
    // normalmente não precisa voltar ordem de coluna
  }
}
