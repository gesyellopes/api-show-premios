/*
|--------------------------------------------------------------------------
| Routes — VENDORS
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import VendorsController from '#controllers/vendors/vendors_controller'

router
  .group(() => {
    router.resource('vendors', VendorsController).apiOnly()

    router.post('vendors/update-range/:id/', [VendorsController, 'updateRange'])
    router.get('vendors/:id/tickets', [VendorsController, 'tickets'])
    router.get('vendors/:id/range', [VendorsController, 'getRange'])
  })
  .prefix('/api/v1')
