/*
|--------------------------------------------------------------------------
| Routes — TENANTS (core / master data)
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import TenantsController from '#controllers/tenants/tenants_controller'

router
  .group(() => {
    router.resource('tenants', TenantsController).apiOnly()
  })
  .prefix('/api/v1')
