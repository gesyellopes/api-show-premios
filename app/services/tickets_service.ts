// app/services/tickets_service.ts
import Ticket from '#models/ticket'
import db from '@adonisjs/lucid/services/db'
import Group from '#models/group'
import Unit from '#models/unit'
import User from '#models/user'
import { DateTime } from 'luxon'

type BulkEditParams = {
  event: number | string
  from: string
  to: string
  unitId?: number | null
  groupId?: number | null
  vendorId?: number | null
}

type BulkEditResult = {
  total_requested: number
  updated: number
  event: number
  from: string
  to: string
  patched_fields: string[]
}

type getTickets = {
  page?: number
  limit?: number
  ticketNumber?: string
  unitId?: number
  groupId?: number
  vendorName?: string
  vendorWhatsapp?: string
  validated?: number
  paid?: number
}

export default class TicketsService {
  // Ajuste se quiser parametrizar
  private static readonly CHUNK = 2000

  // ✅ mova suas utils pra cá (ou importe de onde já estão)
  private static padLeft(n: number, width: number) {
    const s = String(n)
    return s.length >= width ? s : '0'.repeat(width - s.length) + s
  }

  /**
   * Exemplo de parseRange esperado:
   * - retorna { start, end, width }
   * width = tamanho do ticket_number (pra padLeft)
   *
   * SUBSTITUA pela sua implementação real ou importe:
   * import { parseRange } from '#utils/parse_range'
   */
  private static parseRange(from: string, to: string) {
    // Se sua parseRange já existe, apaga isso e importa ela.
    if (!from || !to) throw new Error('from/to inválidos')

    const width = Math.max(from.length, to.length)
    const start = Number(from)
    const end = Number(to)

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      throw new Error('from/to devem ser numéricos')
    }
    if (start > end) throw new Error('from não pode ser maior que to')

    return { start, end, width }
  }

  static async bulkEdit(params: BulkEditParams): Promise<BulkEditResult> {
    const { event, from, to, unitId, groupId, vendorId } = params

    if (event === undefined || event === null || !from || !to) {
      throw new Error('event, from e to são obrigatórios')
    }

    const range = this.parseRange(String(from), String(to))

    // monta patch só com o que veio
    const patch: Record<string, any> = {}

    if (unitId !== undefined) patch.unit_id = unitId
    if (groupId !== undefined) patch.group_id = groupId

    if (vendorId !== undefined) {
      patch.vendor_id = vendorId
      patch.delivered_on = DateTime.now().toFormat('yyyy-LL-dd HH:mm:ss')
    }

    if (Object.keys(patch).length === 0) {
      throw new Error('Envie ao menos um campo para atualizar: unit_id, group_id, vendor_id')
    }

    const total = range.end - range.start + 1
    let updated = 0
    const CHUNK = this.CHUNK

    for (let i = range.start; i <= range.end; i += CHUNK) {
      const chunkEnd = Math.min(i + CHUNK - 1, range.end)

      const numbers: string[] = []
      for (let n = i; n <= chunkEnd; n++) {
        numbers.push(this.padLeft(n, range.width))
      }

      const placeholders = numbers.map(() => '?').join(',')

      const setClauses: string[] = []
      const bindings: any[] = []

      for (const [k, v] of Object.entries(patch)) {
        setClauses.push(`${k} = ?`)
        bindings.push(v)
      }

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
      total_requested: total,
      updated,
      event: Number(event),
      from: String(from),
      to: String(to),
      patched_fields: Object.keys(patch),
    }
  }


  //Função de busca
  static async getTickets(input: getTickets){

    const page = input.page ?? 1
    const limit = input.limit ?? 50

    const unitId = input.unitId ?? null
    const groupId = input.groupId ?? null
    const vendorName = input.vendorName ?? null
    const vendorWhatsapp = input.vendorWhatsapp ?? null
    const validated = Number(input.validated) ?? null
    const ticketNumber = input.ticketNumber ?? null

    //const paid = input.paid ?? null

    const query = Ticket.query()

    if(vendorName || vendorWhatsapp){
      //Preciso buscar os IDs dos vendors que batem com o filtro
      const vendorQuery = User.query()
      if(vendorName) vendorQuery.where('name', 'like', `%${vendorName}%`)
      if(vendorWhatsapp) vendorQuery.where('whatsapp', 'like', `%${vendorWhatsapp}%`)
      const vendors = await vendorQuery.select('id')

      const vendorIds = vendors.map(v => v.id)
      query.whereIn('vendor_id', vendorIds)
    }

    if(unitId) query.where('unit_id', unitId)
    if(groupId) query.where('group_id', groupId)
    if(validated !== null){
      if(validated === 1) query.where('validated', true)
      else if(validated === 0) query.where('validated', false)
    }
    if(ticketNumber) query.where('ticket_number', ticketNumber)

    const tickets = await query.orderBy('ticket_number', 'asc').paginate(page, limit);

    const data: any[] = []
    
    //loop nos tickets
    for(const ticket of tickets){

      const unit = ticket.unitId ? await Unit.find(ticket.unitId) : null
      const group = ticket.groupId ? await Group.find(ticket.groupId) : null
      const vendor = ticket.vendorId ? await User.find(ticket.vendorId) : null

      const ticketData = {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        unit: unit ? { id: unit.id, name: unit.name } : null,
        group: group ? { id: group.id, name: group.name } : null,
        vendor: vendor ? { id: vendor.id, name: vendor.name, whatsapp: vendor.whatsapp } : null,
        deliveredOn: ticket.deliveredOn,
        validated: ticket.validated,
        validatedOn: ticket.validatedOn,
        mirror: ticket.ticketMirror,
        paid: 0 //campo reservado pro futuro
      }

      data.push(ticketData)
    }

    return {
      meta: tickets.getMeta(),
      data: data
    }

  }



}
