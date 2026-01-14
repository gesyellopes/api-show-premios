import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import User from '#models/user'

export default class ResetAllPasswords extends BaseCommand {
  static commandName = 'reset:passwords'
  static description = 'Reseta a senha de todos usuários para 123456 (DEV ONLY)'

  static options: CommandOptions = {
    startApp: true
  }

  async run() {
    const NEW_PASSWORD = '123456'

    // 1. Buscamos todos os usuários. 
    // Nota: Se tiver milhares de usuários, use .eachRow() para não estourar a memória.
    const users = await User.all()
    this.logger.info(`Usuários encontrados: ${users.length}`)

    let ok = 0
    
    for (const user of users) {
      // 2. Atribuímos a senha pura. 
      // O mixin withAuthFinder no seu Model detectará a mudança e fará o hash.
      user.password = NEW_PASSWORD
      
      await user.save()
      
      ok++
      if (ok % 50 === 0) {
        this.logger.info(`Atualizados: ${ok}...`)
      }
    }

    this.logger.success(`Concluído! ${ok} senhas foram resetadas para: ${NEW_PASSWORD}`)
  }
}