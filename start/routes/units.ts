/*
|--------------------------------------------------------------------------
| Routes — UNITS
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import UnitsController from '#controllers/units/units_controller'

router
  .group(() => {
    router.get('units/list', [UnitsController, 'unitsList'])
    //.use(middleware.auth())
    //.use(middleware.acl({ permission: 'view_units' }))

    router.resource('units', UnitsController).apiOnly()
  })
  .prefix('/api/v1')
