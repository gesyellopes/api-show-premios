import type { HttpContext } from '@adonisjs/core/http'
import NotificationService from '#services/notifications_service'


export default class NotificationsController {
  async requestTicketRegistration({ params }: HttpContext) {

    try {
        await NotificationService.requestTicketRegistration({ vendorId: Number(params.id) })

        return { success: true, message: 'Notificação enviada com sucesso' }
    } catch (error) {
        return { success: false, message: 'Erro ao enviar notificação', error: error.message }
    }

  }

}