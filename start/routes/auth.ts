/*
|--------------------------------------------------------------------------
| Routes — AUTH
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import AuthController from '#controllers/auth/auth_controller'
import { middleware } from '#start/kernel'

/**
 * PUBLIC
 */
router
  .group(() => {
    router.post('auth/login', [AuthController, 'login'])
    router.post('auth/forgot-password', [AuthController, 'forgotPassword'])
    router.post('auth/reset-password', [AuthController, 'resetPassword'])
    router.post('auth/validate-otp', [AuthController, 'validateOtp'])
  })
  .prefix('/api/v1')

/**
 * AUTHENTICATED
 */
router
  .group(() => {
    router.get('auth/me', [AuthController, 'me'])
    router.post('auth/logout', [AuthController, 'destroy'])
    router.post('auth/refresh', [AuthController, 'refresh'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())
