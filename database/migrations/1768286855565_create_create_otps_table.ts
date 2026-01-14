import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'otps'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Opcional: se você quiser linkar com user quando existir
      table
        .bigInteger('user_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')

      // WhatsApp normalizado (só dígitos com DDI, ex: 5538999...)
      table.string('whatsapp', 20).notNullable().index()

      // Hash do OTP (NUNCA salvar o OTP puro)
      table.string('code_hash', 255).notNullable()

      // Controle de uso e expiração
      table.timestamp('expires_at', { useTz: false }).notNullable().index()
      table.timestamp('consumed_at', { useTz: false }).nullable().index()

      // Segurança básica
      table.integer('attempts').notNullable().defaultTo(0)
      table.integer('max_attempts').notNullable().defaultTo(5)

      // Contexto do OTP (bom pra separar casos)
      table.string('purpose', 50).notNullable().defaultTo('password_reset')

      table.timestamp('created_at', { useTz: false }).notNullable()
      table.timestamp('updated_at', { useTz: false }).notNullable()

      // Ajuda a buscar o OTP "válido mais recente" por whatsapp/purpose
      table.index(['whatsapp', 'purpose', 'expires_at'], 'otps_whatsapp_purpose_expires_idx')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
