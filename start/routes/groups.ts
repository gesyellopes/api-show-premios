/*
|--------------------------------------------------------------------------
| Routes — GROUPS
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import GroupsController from '#controllers/groups/groups_controller'

router
  .group(() => {
    router.resource('groups', GroupsController).apiOnly()
    router.get('groups/by-unit/:id', [GroupsController, 'byUnit'])
  })
  .prefix('/api/v1')
