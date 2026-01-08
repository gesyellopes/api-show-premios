import db from '@adonisjs/lucid/services/db'
import Ticket from '#models/ticket'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'

function padLeft(n: number, width: number) {
  return String(n).padStart(width, '0')
}

function parseRange(from: string, to: string) {
  if (!from || !to) throw new Error('from e to são obrigatórios')

  if (from.length !== to.length) {
    throw new Error('from e to precisam ter o MESMO tamanho (mesma quantidade de dígitos)')
  }

  const width = from.length
  const start = Number(from)
  const end = Number(to)

  if (!Number.isInteger(start) || !Number.isInteger(end) || Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error('from/to precisam ser números (mesmo que com zeros à esquerda)')
  }

  if (start > end) throw new Error('from não pode ser maior que to')

  return { start, end, width }
}

export default class TicketsController {
  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const q = request.input('q') // busca por ticket_number
    const event = request.input('event')
    const organizationId = request.input('organization_id')
    const unitId = request.input('unit_id')
    const groupId = request.input('group_id')
    const vendorId = request.input('vendor_id')
    const validated = request.input('validated') // 0/1

    const query = Ticket.query()

    if (q) query.where('ticket_number', 'like', `%${q}%`)
    if (event) query.where('event', event)
    if (organizationId) query.where('organization_id', organizationId)
    if (unitId) query.where('unit_id', unitId)
    if (groupId) query.where('group_id', groupId)
    if (vendorId) query.where('vendor_id', vendorId)

    if (validated !== undefined && validated !== null && validated !== '') {
      // aceita "0"/"1", 0/1, true/false
      const v =
        validated === true ||
        validated === 'true' ||
        validated === 1 ||
        validated === '1'
      query.where('validated', v ? 1 : 0)
    }

    return query.orderBy('id', 'desc').paginate(page, limit)
  }

  public async checkValidation({ params, response }: HttpContext) {
    const ticketNumber = params.ticket_number

    const ticket = await Ticket.query()
      .where('ticket_number', ticketNumber)
      .select(['ticket_number', 'validated', 'validated_on'])
      .first()

    if (!ticket) {
      return response.notFound({ success: false, message: 'Ticket não encontrado' })
    }

    return {
      success: true,
      data: {
        ticket_number: ticket.ticketNumber,
        validated: !!ticket.validated,
        validated_on: ticket.validatedOn,
      },
    }
  }

  public async validateByBody({ request, response }: HttpContext) {
    const ticketNumber = request.input('ticket_number')
    const ticketMirror = request.input('ticket_mirror')

    if (!ticketNumber) {
      return response.badRequest({ success: false, message: 'ticket_number é obrigatório' })
    }

    if (!ticketMirror) {
      return response.badRequest({ success: false, message: 'ticket_mirror é obrigatório' })
    }

    const ticket = await Ticket.query()
      .where('ticket_number', ticketNumber)
      .first()

    if (!ticket) {
      return response.notFound({ success: false, message: 'Ticket não encontrado' })
    }

    // atualiza sempre (mesmo se já validado) conforme sua regra
    ticket.ticketMirror = ticketMirror
    ticket.validated = true
    ticket.validatedOn = DateTime.now()

    await ticket.save()

    return {
      success: true,
      data: {
        ticket_number: ticket.ticketNumber,
        validated: true,
        validated_on: ticket.validatedOn,
      },
    }
  }

  async store({ request }: HttpContext) {
    const payload = request.only([
      'ticket_number',
      'event',
      'organization_id',
      'unit_id',
      'group_id',
      'vendor_id',
      'delivered_on',
      'validated',
      'validated_on',
    ])

    return Ticket.create({
      ticketNumber: payload.ticket_number,
      event: payload.event ?? null,
      organizationId: payload.organization_id ?? null,
      unitId: payload.unit_id ?? null,
      groupId: payload.group_id ?? null,
      vendorId: payload.vendor_id ?? null,
      deliveredOn: payload.delivered_on ? DateTime.fromISO(payload.delivered_on) : null,
      validated: payload.validated ?? false,
      validatedOn: payload.validated_on ? DateTime.fromISO(payload.validated_on) : null,
    })
  }

  async show({ params }: HttpContext) {
    return Ticket.findOrFail(params.id)
  }

  async update({ params, request }: HttpContext) {
    const ticket = await Ticket.findOrFail(params.id)

    const payload = request.only([
      'ticket_number',
      'event',
      'organization_id',
      'unit_id',
      'group_id',
      'vendor_id',
      'delivered_on',
      'validated',
      'validated_on',
    ])

    ticket.merge({
      ticketNumber: payload.ticket_number ?? ticket.ticketNumber,
      event: payload.event ?? ticket.event,
      organizationId: payload.organization_id ?? ticket.organizationId,
      unitId: payload.unit_id ?? ticket.unitId,
      groupId: payload.group_id ?? ticket.groupId,
      vendorId: payload.vendor_id ?? ticket.vendorId,
      deliveredOn: payload.delivered_on ? DateTime.fromISO(payload.delivered_on) : ticket.deliveredOn,
      validated: payload.validated ?? ticket.validated,
      validatedOn: payload.validated_on ? DateTime.fromISO(payload.validated_on) : ticket.validatedOn,
    })

    await ticket.save()
    return ticket
  }

  async destroy({ params, response }: HttpContext) {
    const ticket = await Ticket.findOrFail(params.id)
    await ticket.delete()
    return response.noContent()
  }


   /**
   * POST /tickets/bulk/create
   * body: { from, to, event, organization_id }
   */
  public async bulkCreate({ request, response }: HttpContext) {
    const from = request.input('from')
    const to = request.input('to')
    const event = request.input('event')
    const organizationId = request.input('organization_id')

    if (!from || !to || !event || !organizationId) {
      return response.badRequest({
        success: false,
        message: 'from, to, event e organization_id são obrigatórios',
      })
    }

    let range
    try {
      range = parseRange(String(from), String(to))
    } catch (e: any) {
      return response.badRequest({ success: false, message: e.message })
    }

    const total = range.end - range.start + 1

    // chunk de inserção pra não estourar memória/packet
    const CHUNK = 2000

    let created = 0
    let skipped = 0

    for (let i = range.start; i <= range.end; i += CHUNK) {
      const chunkEnd = Math.min(i + CHUNK - 1, range.end)

      const rows = []
      for (let n = i; n <= chunkEnd; n++) {
        rows.push({
          ticket_number: padLeft(n, range.width),
          event: Number(event),
          organization_id: Number(organizationId),
          // validated default 0 no banco, então nem precisa enviar
        })
      }

      /**
       * Como você não quer FK e pode já existir ticket_number,
       * o melhor é: inserir e ignorar duplicado.
       * Isso exige índice UNIQUE no par (event, ticket_number).
       *
       * Se NÃO tiver UNIQUE, pode duplicar sem querer.
       */
      const insertSql = `
        INSERT IGNORE INTO tickets (ticket_number, event, organization_id)
        VALUES ${rows.map(() => '(?, ?, ?)').join(',')}
      `

      const bindings: any[] = []
      for (const r of rows) {
        bindings.push(r.ticket_number, r.event, r.organization_id)
      }

      const result: any = await db.rawQuery(insertSql, bindings)

      // MySQL: affectedRows = inseridos (ignorados não contam)
      created += Number(result[0]?.affectedRows ?? 0)
      skipped += rows.length - Number(result[0]?.affectedRows ?? 0)
    }

    return {
      success: true,
      data: {
        total_requested: total,
        created,
        skipped,
        event: Number(event),
        organization_id: Number(organizationId),
        from: String(from),
        to: String(to),
      },
    }
  }

  /**
   * POST /tickets/bulk/edit
   * body: { event, from, to, unit_id?, group_id?, vendor_id? }
   */
  public async bulkEdit({ request, response }: HttpContext) {
    const event = request.input('event')
    const from = request.input('from')
    const to = request.input('to')

    if (!event || !from || !to) {
      return response.badRequest({
        success: false,
        message: 'event, from e to são obrigatórios',
      })
    }

    let range
    try {
      range = parseRange(String(from), String(to))
    } catch (e: any) {
      return response.badRequest({ success: false, message: e.message })
    }

    // campos opcionais
    const unitId = request.input('unit_id')
    const groupId = request.input('group_id')
    const vendorId = request.input('vendor_id')

    // monta objeto de update só com o que veio
    const patch: Record<string, any> = {}

    if (unitId !== undefined) patch.unit_id = unitId
    if (groupId !== undefined) patch.group_id = groupId

    if (vendorId !== undefined) {
      patch.vendor_id = vendorId
      patch.delivered_on = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
    }

    if (Object.keys(patch).length === 0) {
      return response.badRequest({
        success: false,
        message: 'Envie ao menos um campo para atualizar: unit_id, group_id, vendor_id',
      })
    }

    const total = range.end - range.start + 1
    const CHUNK = 2000
    let updated = 0

    /**
     * Estratégia performática:
     * - em vez de dar 1 update por ticket, fazemos:
     *   UPDATE tickets SET ... WHERE event=? AND ticket_number IN (...)
     * em chunks.
     */
    for (let i = range.start; i <= range.end; i += CHUNK) {
      const chunkEnd = Math.min(i + CHUNK - 1, range.end)

      const numbers: string[] = []
      for (let n = i; n <= chunkEnd; n++) {
        numbers.push(padLeft(n, range.width))
      }

      const placeholders = numbers.map(() => '?').join(',')

      const setClauses: string[] = []
      const bindings: any[] = []

      for (const [k, v] of Object.entries(patch)) {
        setClauses.push(`${k} = ?`)
        bindings.push(v)
      }

      // opcional: updated_at automático do MySQL via ON UPDATE
      const sql = `
        UPDATE tickets
        SET ${setClauses.join(', ')}
        WHERE event = ?
          AND ticket_number IN (${placeholders})
      `

      bindings.push(Number(event), ...numbers)

      const result: any = await db.rawQuery(sql, bindings)
      updated += Number(result[0]?.affectedRows ?? 0)
    }

    return {
      success: true,
      data: {
        total_requested: total,
        updated,
        event: Number(event),
        from: String(from),
        to: String(to),
        patched_fields: Object.keys(patch),
      },
    }
  }
}
