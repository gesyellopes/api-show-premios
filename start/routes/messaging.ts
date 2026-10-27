/*
|--------------------------------------------------------------------------
| Routes — MESSAGING (notifications + whatsapp allowed numbers)
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import NotificationsController from '#controllers/messaging/notifications_controller'
import WhatsappAllowedNumbersController from '#controllers/messaging/whatsapp_allowed_numbers_controller'

router
  .group(() => {
    router.resource('whatsapp-allowed-numbers', WhatsappAllowedNumbersController).apiOnly()

    router.get('notifications/request-ticket-registration/:id', [
      NotificationsController,
      'requestTicketRegistration',
    ])
  })
  .prefix('/api/v1')
