/*
|--------------------------------------------------------------------------
| Routes — USERS (core / master data)
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import UsersController from '#controllers/users/users_controller'

router
  .group(() => {
    router.resource('users', UsersController).apiOnly()
  })
  .prefix('/api/v1')
