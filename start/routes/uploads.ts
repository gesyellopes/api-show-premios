/*
|--------------------------------------------------------------------------
| Routes — UPLOADS (imagens para o storage)
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import UploadsController from '#controllers/uploads/uploads_controller'

router
  .group(() => {
    router.post('uploads', [UploadsController, 'store'])
  })
  .prefix('/api/v1')
