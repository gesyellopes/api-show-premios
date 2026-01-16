import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  // You don't need to define the protected tableName property here
  // as you are working directly with the schema builder methods.

  public async up() {
    // Rename the 'old_table_name' to 'new_table_name'
    this.schema.renameTable('raffle_round_draws', 'raffle_round_called_numbers')
  }

  public async down() {
    // Reverse the operation: rename 'new_table_name' back to 'old_table_name'
    this.schema.renameTable('raffle_round_called_numbers', 'raffle_round_draws')
  }
}
