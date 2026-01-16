import type { HttpContext } from '@adonisjs/core/http'
import Raffle, { type RaffleStatus } from '#models/raffle'
import RoundService from '#services/round_service'

const DEFAULT_TENANT_ID = 1

const ALLOWED_STATUS: RaffleStatus[] = [
  'draft',
  'active',
  'completed',
  'canceled',
  'test',
]

export default class RafflesController {
  /**
   * GET /raffles
   */
  async index() {
    const raffles = await Raffle.query()
      .where('tenant_id', DEFAULT_TENANT_ID)
      .orderBy('id', 'desc')

    return { success: true, data: raffles }
  }

  /**
   * POST /raffles
   */
  async store({ request }: HttpContext) {
    const payload = request.only([
      'event_id',
      'name',
      'status',
      'event_date',
      'ruleset',
    ])

    const eventId = Number(payload.event_id)
    const name = String(payload.name ?? '').trim()
    const status = (payload.status ?? 'draft') as RaffleStatus
    const eventDate = payload.event_date

    if (!eventId) return { success: false, message: 'event_id is required' }
    if (!name) return { success: false, message: 'name is required' }
    if (!eventDate) return { success: false, message: 'event_date is required' }
    if (!ALLOWED_STATUS.includes(status)) {
      return { success: false, message: 'Invalid status' }
    }

    const raffle = await Raffle.create({
      tenantId: DEFAULT_TENANT_ID,
      eventId,
      name,
      status,
      eventDate,
      ruleset: payload.ruleset ?? null,
    })

    return { success: true, data: raffle }
  }

  /**
   * GET /raffles/:id
   */
  async show({ params }: HttpContext) {
    const raffle = await Raffle.query()
      .where('tenant_id', DEFAULT_TENANT_ID)
      .where('id', params.id)
      .first()

    if (!raffle) {
      return { success: false, message: 'Raffle not found' }
    }

    return { success: true, data: raffle }
  }

  /**
   * PUT /raffles/:id
   */
  async update({ params, request }: HttpContext) {
    const raffle = await Raffle.query()
      .where('tenant_id', DEFAULT_TENANT_ID)
      .where('id', params.id)
      .first()

    if (!raffle) {
      return { success: false, message: 'Raffle not found' }
    }

    const payload = request.only([
      'event_id',
      'name',
      'status',
      'event_date',
      'ruleset',
    ])

    if (payload.event_id !== undefined) raffle.eventId = Number(payload.event_id)
    if (payload.name !== undefined) raffle.name = String(payload.name).trim()

    if (payload.status !== undefined) {
      const nextStatus = payload.status as RaffleStatus
      if (!ALLOWED_STATUS.includes(nextStatus)) {
        return { success: false, message: 'Invalid status' }
      }
      raffle.status = nextStatus
    }

    if (payload.event_date !== undefined) raffle.eventDate = payload.event_date
    if (payload.ruleset !== undefined) raffle.ruleset = payload.ruleset ?? null

    await raffle.save()

    return { success: true, data: raffle }
  }

  /**
   * DELETE /raffles/:id
   */
  async destroy({ params }: HttpContext) {
    const raffle = await Raffle.query()
      .where('tenant_id', DEFAULT_TENANT_ID)
      .where('id', params.id)
      .first()

    if (!raffle) {
      return { success: false, message: 'Raffle not found' }
    }

    await raffle.delete()

    return { success: true, message: 'Raffle deleted successfully' }
  }


  //Essa função eu irei chamar um número para um round específico. É nela que efetivamente chama o sorteio

  async callNumber({ request }: HttpContext) {

    const paylod = {
        raffleId: Number(request.input('raffle_id')),
        roundId: Number(request.input('round_id')),
        numberToCall: Number(request.input('called_number')),
        drawOrder: Number(request.input('draw_order')) || 0,
    }

    if (!paylod.raffleId) {
      return { success: false, message: 'Invalid raffle ID' }
    }

    if (!paylod.roundId) {
      return { success: false, message: 'Invalid round ID' }
    }

    if (!paylod.numberToCall) {
      return { success: false, message: 'Number to call is required' }
    }

    //Chamo o serviço que faz a lógica de chamada do número
    const result = await RoundService.callNumber(paylod);

    return result;
    
  }


  async removeCallNumber({ request }: HttpContext) {

    const paylod = {
        raffleId: Number(request.input('raffle_id')),
        roundId: Number(request.input('round_id')),
        numberToCall: Number(request.input('called_number')),
    }

    if (!paylod.raffleId) {
      return { success: false, message: 'Invalid raffle ID' }
    }

    if (!paylod.roundId) {
      return { success: false, message: 'Invalid round ID' }
    }

    if (!paylod.numberToCall) {
      return { success: false, message: 'Number to call is required' }
    }

    //Chamo o serviço que faz a lógica de chamada do número
    const result = await RoundService.removeCalledNumber(paylod);

    return result;
    
  }

}
