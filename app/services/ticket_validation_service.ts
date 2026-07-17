import Ticket from '#models/ticket'
import TicketAuxiliarTable from '#models/ticket_auxiliar_table'
import TicketWhatsappMessage from '#models/ticket_whatsapp_message'
import { DateTime } from 'luxon'
import env from '#start/env'

export default class TicketValidationService {
  /**
   * Valida um ticket
   * @param ticketNumber - Número do ticket
   * @param validatedOn - Data de validação
   * @param ticketMirror - Espelho do ticket
   */
  static async validateTicket(ticketNumber: string, validatedOn: DateTime, ticketMirror: string) {
    const ticket = await Ticket.query().where('ticket_number', ticketNumber).first()

    if (!ticket) {
      throw new Error('Ticket não encontrado')
    }

    ticket.validated = true
    ticket.validatedOn = validatedOn
    ticket.ticketMirror = ticketMirror

    await ticket.save()

    return {
      success: true,
      data: {
        ticket_number: ticket.ticketNumber,
        validated: true,
        validated_on: ticket.validatedOn,
        ticket_mirror: ticket.ticketMirror,
      },
    }
  }

  /**
   * Desvalida um ticket (remove as informações de validação)
   * @param ticketNumber - Número do ticket
   */
  static async invalidateTicket(ticketNumber: string) {
    const ticket = await Ticket.query().where('ticket_number', ticketNumber).first()

    if (!ticket) {
      throw new Error('Ticket não encontrado')
    }

    ticket.validated = false
    ticket.validatedOn = null
    ticket.ticketMirror = null

    await ticket.save()

    const ticketPrefix = env.get('TICKET_PREFIX', 'AD')
    const prefixedTicketNumber = `${ticketPrefix}${ticketNumber}`

    // Atualizar ticket_auxiliar_table
    const ticketAuxiliar = await TicketAuxiliarTable.query()
      .where('ticket_number', prefixedTicketNumber)
      .first()

    if (ticketAuxiliar) {
      ticketAuxiliar.status = 'WAITING_SALE'
      ticketAuxiliar.messageId = ''
      ticketAuxiliar.validatedAt = null
      await ticketAuxiliar.save()
    }

    // Atualizar todos os ticket_whatsapp_messages com esse ticket_number para REJECTED
    await TicketWhatsappMessage.query().where('ticket_number', prefixedTicketNumber).update({
      status: 'REJECTED',
    })

    return {
      success: true,
      data: {
        ticket_number: ticket.ticketNumber,
        validated: false,
        validated_on: null,
        ticket_mirror: null,
      },
    }
  }
}
