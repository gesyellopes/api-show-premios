import TicketWhatsappMessage from '#models/ticket_whatsapp_message'
import TicketAuxiliarTable from '#models/ticket_auxiliar_table'
import TicketAuxiliar from '#models/ticket_auxiliar'
import WapiService from '#services/messages_service'
import env from '#start/env'
import { DateTime } from 'luxon'

type GetMessagesInput = {
  page?: number
  limit?: number
  senderNumber?: string
  senderName?: string
  sentAt?: string
}

type ManualValidateInput = {
  message_id: string
  ticket_number: string
}

export default class TicketWhatsappMessagesService {
  static async getMessages(input: GetMessagesInput) {
    const page = input.page ?? 1
    const limit = input.limit ?? 50
    const offset = (page - 1) * limit
    const senderNumber = input.senderNumber ?? null
    const senderName = input.senderName ?? null
    const sentAt = input.sentAt ?? null

    const query = TicketWhatsappMessage.query()
      .whereNot('status', 'VALIDATED')
      .whereNot('status', 'REJECTED')

    if (senderNumber !== null) {
      query.where('sender_number', 'like', `%${senderNumber as string}%`)
    }
    if (senderName !== null) {
      query.where('sender_name', 'like', `%${senderName as string}%`)
    }
    if (sentAt !== null) {
      const startOfDay = DateTime.fromISO(sentAt as string).startOf('day')
      const endOfDay = DateTime.fromISO(sentAt as string).endOf('day')
      query.whereBetween('sent_at', [startOfDay.toJSDate(), endOfDay.toJSDate()])
    }

    // Conta total
    const countQuery = TicketWhatsappMessage.query()
      .whereNot('status', 'VALIDATED')
      .whereNot('status', 'REJECTED')

    if (senderNumber !== null) {
      countQuery.where('sender_number', 'like', `%${senderNumber as string}%`)
    }
    if (senderName !== null) {
      countQuery.where('sender_name', 'like', `%${senderName as string}%`)
    }
    if (sentAt !== null) {
      const startOfDay = DateTime.fromISO(sentAt as string).startOf('day')
      const endOfDay = DateTime.fromISO(sentAt as string).endOf('day')
      countQuery.whereBetween('sent_at', [startOfDay.toJSDate(), endOfDay.toJSDate()])
    }

    const total = await countQuery.count('* as total').first()
    const totalCount = Number(total?.$extras?.total ?? 0)

    const messages = await query
      .orderBy('sent_at', 'desc')
      .limit(limit)
      .offset(offset)

    return {
      meta: {
        total: totalCount,
        perPage: limit,
        currentPage: page,
        lastPage: Math.ceil(totalCount / limit),
        firstPage: 1,
        firstPageUrl: `/?page=1`,
        lastPageUrl: `/?page=${Math.ceil(totalCount / limit)}`,
        nextPageUrl: page < Math.ceil(totalCount / limit) ? `/?page=${page + 1}` : null,
        previousPageUrl: page > 1 ? `/?page=${page - 1}` : null,
      },
      data: messages.map((msg) => ({
        message_id: msg.messageId,
        sender_number: msg.senderNumber,
        sender_name: msg.senderName,
        sent_at: msg.sentAt,
        whatsapp_message_id: msg.whatsappMessageId,
        filename: msg.filename,
      })),
    }
  }

  static async manualValidate(input: ManualValidateInput) {
    const { message_id, ticket_number } = input
    const ticketPrefix = env.get('TICKET_PREFIX', 'AC')

    if (!message_id || !ticket_number) {
      throw new Error('message_id e ticket_number são obrigatórios')
    }

    // 1. Buscar a mensagem no ticket_whatsapp_messages
    const whatsappMessage = await TicketWhatsappMessage.query()
      .where('message_id', message_id)
      .first()

    if (!whatsappMessage) {
      throw new Error('Mensagem não encontrada')
    }

    // 2. Atualizar status para MANUAL_VALIDATED
    whatsappMessage.status = 'VALIDATED'
    await whatsappMessage.save()

    // 3. Buscar o ticket com prefixo
    const prefixedTicketNumber = `${ticketPrefix}${ticket_number}`
    const ticket = await TicketAuxiliarTable.query()
      .where('ticket_number', prefixedTicketNumber)
      .first()

    if (!ticket) {
      throw new Error(`Ticket ${prefixedTicketNumber} não encontrado`)
    }

    // Validar se já está validado
    if (ticket.status === 'VALIDATED') {
      throw new Error(`O ticket ${ticket_number} já está validado e não pode ser alterado manualmente`)
    }

    // 4. Atualizar o ticket
    ticket.status = 'VALIDATED'
    ticket.messageId = message_id
    ticket.validatedAt = DateTime.now()
    await ticket.save()

    // 5. Atualizar o ticket auxiliar (sem prefixo)
    const ticketAuxiliar = await TicketAuxiliar.query()
      .where('ticket_number', ticket_number)
      .first()

    if (ticketAuxiliar) {
      ticketAuxiliar.validated = true
      ticketAuxiliar.validatedOn = DateTime.now()
      ticketAuxiliar.ticketMirror = whatsappMessage.filename
      await ticketAuxiliar.save()
    }

    // 6. Enviar mensagem via WhatsApp como reply
    const senderPhone = whatsappMessage.senderNumber
    const replyMessageId = whatsappMessage.whatsappMessageId
    const message = `🟩 O canhoto *${ticket_number}* foi validado com sucesso por um de nossos coordenadores e já está concorrendo 🟩`

    try {
      await WapiService.sendWhatsappText({
        phone: senderPhone,
        message,
        messageId: replyMessageId,
      })
    } catch (error) {
      console.error('Erro ao enviar mensagem de validação:', error)
    }

    return {
      success: true,
      data: {
        message_id,
        ticket_number,
        prefixed_ticket_number: prefixedTicketNumber,
        status: 'MANUAL_VALIDATED',
        message_sent: true,
      },
    }
  }

  static async rejectMessage(message_id: string) {
    if (!message_id) {
      throw new Error('message_id é obrigatório')
    }

    const whatsappMessage = await TicketWhatsappMessage.query()
      .where('message_id', message_id)
      .first()

    if (!whatsappMessage) {
      throw new Error('Mensagem não encontrada')
    }

    whatsappMessage.status = 'REJECTED'
    await whatsappMessage.save()

    return {
      success: true,
      data: {
        message_id,
        status: 'REJECTED',
      },
    }
  }
}
