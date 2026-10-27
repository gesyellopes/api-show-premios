/*
|--------------------------------------------------------------------------
| Routes — TICKETS
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import TicketsController from '#controllers/tickets/tickets_controller'
import TicketWhatsappMessagesController from '#controllers/tickets/ticket_whatsapp_messages_controller'

router
  .group(() => {
    router.get('validate/:ticket_number', [TicketsController, 'checkValidation'])
    router.post('validate', [TicketsController, 'validateByBody'])
    router.post('invalidate', [TicketsController, 'invalidateByBody'])

    router.post('tickets/return', [TicketsController, 'returnTickets'])
    router.post('tickets/bulk/create', [TicketsController, 'bulkCreate'])
    router.post('tickets/bulk/edit', [TicketsController, 'bulkEdit'])
    router.post('tickets/auxiliar/bulk/create', [TicketsController, 'bulkCreateAuxiliar'])

    router.resource('tickets', TicketsController).apiOnly()

    /**
     * TICKET WHATSAPP MESSAGES
     */
    router.get('ticket-whatsapp-messages', [TicketWhatsappMessagesController, 'index'])
    router.post('ticket-whatsapp-messages/manual-validate', [
      TicketWhatsappMessagesController,
      'manualValidate',
    ])
    router.post('ticket-whatsapp-messages/reject', [TicketWhatsappMessagesController, 'reject'])
  })
  .prefix('/api/v1')
