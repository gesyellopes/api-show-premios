import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace' // Importe o tipo
import hash from '@adonisjs/core/services/hash'
import User from '#models/user';

export default class TestAuth extends BaseCommand {
  static commandName = 'test:auth';
  static description = 'Test user authentication by whatsapp and password';

  static options: CommandOptions = {
    startApp: true
  }

  public async run() {

    const random = Math.floor(Math.random() * 100000)
    const whatsapp = `5598888${random}`
    const password = '123456'

    const hashed = await hash.make(password)
    this.logger.info(`verify local: ${await hash.verify(hashed, password)}`)

    const user = await User.create({
      name: `Auth Test ${random}`,
      whatsapp,
      password: '123456',
      role: 'vendor',
      tenantId: 1,
    })

    /*

    await user.refresh()

    this.logger.info(`verify db: ${await hash.verify(user.password!, password)}`)
    this.logger.success(`User criado: ${user.id} / ${user.whatsapp}`)

    */
    // depois do create
    this.logger.info(`saved hashed length: ${hashed.length}`)
    this.logger.info(`saved hashed starts: ${hashed.slice(0, 20)}`)

    await user.refresh()

    this.logger.info(`after refresh user.password type: ${typeof user.password}`)
    this.logger.info(`after refresh user.password length: ${user.password?.length}`)
    this.logger.info(`after refresh starts: ${user.password?.slice(0, 20)}`)

    this.logger.info(`hash === dbHash ? ${hashed === user.password}`)

    for (let i = 0; i < hashed.length; i++) {
      if (hashed[i] !== user.password![i]) {
        this.logger.error(`DIFF at ${i}: ${hashed.charCodeAt(i)} vs ${user.password!.charCodeAt(i)}`)
        break
      }
    }



    this.logger.info(`verify db: ${await hash.verify(user.password!, password)}`)



  }
}
