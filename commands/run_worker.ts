import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import { Worker } from 'bullmq'
import env from '#start/env'

export default class RunWorker extends BaseCommand {
  static commandName = 'queue:worker'
  static description = 'Inicia o worker do BullMQ'

  static options: CommandOptions = {
    startApp: true, // Garante queModels e Env funcionem
  }

  async run() {
    const worker = new Worker(
      'test-queue',
      async (job) => {
        // CORREÇÃO DO ERRO TS(2345): Passe a string primeiro, depois o objeto

        const { message } = job.data

        this.logger.info(`Processando job ${job.id}: ${job.name}`)
        this.logger.info(message)
        
        // Simulação de tarefa
        await new Promise((r) => setTimeout(r, 1000))
        return { processed: true }
      },
      {
        connection: { 
          url: env.get('REDIS_URL'),
          maxRetriesPerRequest: null,
          enableReadyCheck: false
        },
        concurrency: 5,
      }
    )

    worker.on('completed', (job) => {
      this.logger.success(`Job ${job.id} finalizado!`)
    })

    worker.on('failed', (job, err) => {
      this.logger.error(`Job ${job?.id} falhou: ${err.message}`)
    })

    this.logger.info('Worker aguardando jobs...')

    // Mantém o comando rodando infinitamente
    await new Promise(() => {})
  }
}