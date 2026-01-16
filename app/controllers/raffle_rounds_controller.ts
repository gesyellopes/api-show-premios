import type { HttpContext } from '@adonisjs/core/http'
import RaffleRound, { type RaffleRoundStatus } from '#models/raffle_round'
import RoundService from '#services/round_service'

const DEFAULT_TENANT_ID = 1 // por enquanto (não usado diretamente aqui)

const ALLOWED_STATUS: RaffleRoundStatus[] = ['scheduled', 'running', 'closed', 'void']

export default class RaffleRoundsController {
  /**
   * GET /raffle-rounds?raffle_id=1
   * filtros opcionais:
   * - status
   * - round_number
   */
  async index({ request }: HttpContext) {
    const raffleId = Number(request.input('raffle_id'))
    const status = request.input('status') as RaffleRoundStatus | undefined
    const roundNumber = request.input('round_number')

    if (!raffleId) {
      return { success: false, message: 'raffle_id is required' }
    }

    const query = RaffleRound.query().where('raffle_id', raffleId)

    if (status) query.where('status', status)
    if (roundNumber) query.where('round_number', Number(roundNumber))

    const data = await query.orderBy('round_number', 'asc')

    return { success: true, data }
  }

  /**
   * POST /raffle-rounds
   * body: { raffle_id, description?, round_number, status?, prize? }
   * (tickets_count/start_at/decided_at são controlados pelo sistema)
   */
  async store({ request }: HttpContext) {
    const payload = request.only([
      'raffle_id',
      'description',
      'round_number',
      'status',
      'prize',
    ])

    const raffleId = Number(payload.raffle_id)
    const roundNumber = Number(payload.round_number)
    const status = (payload.status ?? 'scheduled') as RaffleRoundStatus

    if (!raffleId) return { success: false, message: 'raffle_id is required' }
    if (!roundNumber) return { success: false, message: 'round_number is required' }
    if (!ALLOWED_STATUS.includes(status)) {
      return { success: false, message: 'Invalid status' }
    }

    // evita duplicar round_number dentro do mesmo raffle (mesmo se você já tem unique no banco)
    const exists = await RaffleRound.query()
      .where('raffle_id', raffleId)
      .where('round_number', roundNumber)
      .first()

    if (exists) {
      return { success: false, message: `Round number ${roundNumber} already exists for this raffle` }
    }

    const round = await RaffleRound.create({
      raffleId,
      description: payload.description ?? null,
      roundNumber,
      status,
      prize: payload.prize ?? null,
      ticketsCount: null,
      startAt: null,
      decidedAt: null,
    })

    return { success: true, data: round }
  }

  /**
   * GET /raffle-rounds/:id
   */
  async show({ params }: HttpContext) {
    const round = await RaffleRound.find(params.id)

    if (!round) {
      return { success: false, message: 'Round not found' }
    }

    return { success: true, data: round }
  }

  /**
   * PUT /raffle-rounds/:id
   * body: { description?, round_number?, status?, prize? }
   */
  async update({ params, request }: HttpContext) {
    const round = await RaffleRound.find(params.id)

    if (!round) {
      return { success: false, message: 'Round not found' }
    }

    const payload = request.only(['description', 'round_number', 'status', 'prize'])

    if (payload.description !== undefined) {
      round.description = payload.description ?? null
    }

    if (payload.prize !== undefined) {
      round.prize = payload.prize ?? null
    }

    if (payload.status !== undefined) {
      const nextStatus = payload.status as RaffleRoundStatus
      if (!ALLOWED_STATUS.includes(nextStatus)) {
        return { success: false, message: 'Invalid status' }
      }
      round.status = nextStatus
    }

    // se mudar round_number, garante unicidade por raffle
    if (payload.round_number !== undefined) {
      const nextRoundNumber = Number(payload.round_number)
      if (!nextRoundNumber) {
        return { success: false, message: 'round_number must be a number > 0' }
      }

      const exists = await RaffleRound.query()
        .where('raffle_id', round.raffleId)
        .where('round_number', nextRoundNumber)
        .whereNot('id', round.id)
        .first()

      if (exists) {
        return { success: false, message: `Round number ${nextRoundNumber} already exists for this raffle` }
      }

      round.roundNumber = nextRoundNumber
    }

    await round.save()

    return { success: true, data: round }
  }

  /**
   * DELETE /raffle-rounds/:id
   */
  async destroy({ params }: HttpContext) {
    const round = await RaffleRound.find(params.id)

    if (!round) {
      return { success: false, message: 'Round not found' }
    }

    await round.delete()

    return { success: true, message: 'Round deleted successfully' }
  }


  //Round Start

  async startRound({ params }: HttpContext) {

    const roundStart = await RoundService.startRound({ roundId: Number(params.id) })

    return roundStart;


    /*
    if(!roundStart.success){
      return { success: false, message: roundStart.message }
    }

    return { success: true, data: roundStart.data  }
    */

  }

}
