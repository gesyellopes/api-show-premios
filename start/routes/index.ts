/*
|--------------------------------------------------------------------------
| Routes file (entrypoint)
|--------------------------------------------------------------------------
| Cada domínio tem seu arquivo em start/routes/. A ordem dos imports
| define a ordem de registro das rotas.
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'

import './uploads.js'
import './auth.js'
import './tenants.js'
import './users.js'
import './units.js'
import './groups.js'
import './vendors.js'
import './tickets.js'
import './reports.js'
import './messaging.js'
import './raffles.js'

/**
 * ============================================================================
 * INFRA / DEV ROUTES
 * ============================================================================
 */
// import { testQueue } from '#start/queues/queue_test'
// router.get('/test-queue', async () => {
//   await testQueue.add('test-job', {
//     message: 'Fila funcionando 🎯',
//     timestamp: new Date().toISOString(),
//   })

//   return { success: true }
// })

/**
 * ============================================================================
 * ROOT
 * ============================================================================
 */
router.get('/', async () => {
  return { hello: 'world' }
})
