#!/usr/bin/env node
import 'reflect-metadata'
import { URL } from 'node:url'
import env from '#start/env'
import { Worker } from 'bullmq'
import { Ignitor } from '@adonisjs/core'
import type { ApplicationService } from '@adonisjs/core/types'

async function main() {
  const appRoot = new URL('../', import.meta.url)
  const ignitor = new Ignitor(appRoot)
  const app = ignitor.createApp('web') as ApplicationService
  
  await app.init()
  await app.boot()

  // Buscamos o logger diretamente do contêiner para garantir a tipagem
  const logger = await app.container.make('logger')

  const worker = new Worker(
    'test-queue',
    async (job) => {
      logger.info({ id: job.id, name: job.name }, 'JOB RECEBIDO ✅')
      return { processed: true }
    },
    {
      connection: { url: env.get('REDIS_URL') } as any,
      concurrency: 5,
    }
  )

  worker.on('completed', (job) => {
    logger.info({ id: job.id }, 'JOB COMPLETED 🎉')
  })

  // Para o shutdown
  process.on('SIGINT', async () => {
    await worker.close()
    await app.terminate()
    process.exit(0)
  })
}

main().catch(console.error)