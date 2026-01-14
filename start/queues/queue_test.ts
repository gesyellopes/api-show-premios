import { Queue } from 'bullmq'
import env from '#start/env'

function redisConnection() {
  const url = new URL(env.get('REDIS_URL'))

  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: url.password || undefined,
    maxRetriesPerRequest: null as any,
  }
}

export const testQueue = new Queue('test-queue', {
  connection: redisConnection(),
})
