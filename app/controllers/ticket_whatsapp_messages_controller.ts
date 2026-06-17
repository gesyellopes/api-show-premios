import type { HttpContext } from '@adonisjs/core/http'
import TicketWhatsappMessagesService from '#services/ticket_whatsapp_messages_service'

export default class TicketWhatsappMessagesController {
  async index({ request }: HttpContext) {
    const payload = {
      page: request.input('page', 1),
      limit: request.input('limit', 50),
      senderNumber: request.input('sender_number'),
      senderName: request.input('sender_name'),
      sentAt: request.input('sent_at'),
    }

    return TicketWhatsappMessagesService.getMessages(payload)
  }

  async manualValidate({ request, response }: HttpContext) {
    const payload = request.only(['message_id', 'ticket_number'])

    if (!payload.message_id || !payload.ticket_number) {
      return response.badRequest({
        success: false,
        message: 'message_id e ticket_number são obrigatórios',
      })
    }

    try {
      const result = await TicketWhatsappMessagesService.manualValidate(payload)
      return response.ok(result)
    } catch (error: any) {
      return response.badRequest({
        success: false,
        message: error.message,
      })
    }
  }
}
