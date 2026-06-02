import Ticket from '#models/ticket'
import { DateTime } from 'luxon'
import logger from '@adonisjs/core/services/logger'

export default class TicketValidationService {
  /**
   * Valida um ticket
   * @param ticketNumber - Número do ticket
   * @param validatedOn - Data de validação
   * @param ticketMirror - Espelho do ticket
   */
  static async validateTicket(ticketNumber: string, validatedOn: DateTime, ticketMirror: string) {
    const ticket = await Ticket.query()
      .where('ticket_number', ticketNumber)
      .first()

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
    const ticket = await Ticket.query()
      .where('ticket_number', ticketNumber)
      .first()

    if (!ticket) {
      throw new Error('Ticket não encontrado')
    }

    ticket.validated = false
    ticket.validatedOn = null
    ticket.ticketMirror = null

    await ticket.save()

    try {
      await this.callExternalInvalidateApi(ticketNumber)
    } catch (error: any) {
      logger.error(
        { ticketNumber, error: error.message },
        'Falha ao chamar API externa de invalidação'
      )
    }

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

  private static async callExternalInvalidateApi(ticketNumber: string) {
    const apiUrl = `https://api-v3.showdepremios.cloud/api/tickets/invalidate/${ticketNumber}`

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(
        `API retornou status ${response.status}: ${response.statusText}`
      )
    }
  }
}
