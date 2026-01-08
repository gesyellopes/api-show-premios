// app/controllers/whatsapp_allowed_numbers_controller.ts
import WhatsappAllowedNumber from '#models/whatsapp_allowed_number'
import type { HttpContext } from '@adonisjs/core/http'

function normalizeWhatsapp(raw: unknown) {
  return String(raw ?? '').replace(/\D/g, '')
}

export default class WhatsappAllowedNumbersController {
  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    return WhatsappAllowedNumber
      .query()
      .orderBy('id', 'desc')
      .paginate(page, limit)
  }

  async store({ request, response }: HttpContext) {
    const rawWhatsapp = request.input('whatsapp_number')
    const userId = request.input('user_id')

    if (!rawWhatsapp) {
      return response.badRequest({
        success: false,
        message: 'whatsapp_number é obrigatório',
      })
    }

    const whatsappNumber = normalizeWhatsapp(rawWhatsapp)

    const exists = await WhatsappAllowedNumber
      .query()
      .where('whatsapp_number', whatsappNumber)
      .first()

    if (exists) {
      return response.conflict({
        success: false,
        message: 'Número já cadastrado',
      })
    }

    const record = await WhatsappAllowedNumber.create({
      whatsappNumber,
      userId: userId ?? null,
    })

    return { success: true, data: record }
  }

  async destroy({ params, response }: HttpContext) {
    const record = await WhatsappAllowedNumber.findOrFail(params.id)
    await record.delete()
    return response.noContent()
  }

  /**
   * 🔥 Check simples (pra webhook / auth / validação)
   * GET /whatsapp-allowed-numbers/check/:whatsapp
   */
  async check({ params }: HttpContext) {
    const whatsapp = normalizeWhatsapp(params.whatsapp)

    const found = await WhatsappAllowedNumber
      .query()
      .where('whatsapp_number', whatsapp)
      .first()

    return {
      success: true,
      allowed: !!found,
    }
  }
}
