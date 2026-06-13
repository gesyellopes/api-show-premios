// app/services/tickets_service.ts
import Ticket from '#models/ticket'
import TicketWhatsappMessage from '#models/ticket_whatsapp_message'
import db from '@adonisjs/lucid/services/db'
import Group from '#models/group'
import Unit from '#models/unit'
import User from '#models/user'
import TicketLog from '#models/ticket_log'
import TicketReturn from '#models/ticket_return'
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

type returnTickets = {
  tenant_id?: number
  event_id: number
  unit_id?: number
  ticket_from: string
  ticket_to: string
  reason: string
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
        UPDATE tickets_pirapora
        SET ${setClauses.join(', ')}
        WHERE event_id = ?
          AND ticket_number IN (${placeholders})
      `

      bindings.push(Number(event), ...numbers)

      const result: any = await db.connection('secondary').rawQuery(sql, bindings)
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
  static async getTickets(input: getTickets) {
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

    if (vendorName || vendorWhatsapp) {
      //Preciso buscar os IDs dos vendors que batem com o filtro
      const vendorQuery = User.query()
      if (vendorName) vendorQuery.where('name', 'like', `%${vendorName}%`)
      if (vendorWhatsapp) vendorQuery.where('whatsapp', 'like', `%${vendorWhatsapp}%`)
      const vendors = await vendorQuery.select('id')

      const vendorIds = vendors.map((v) => v.id)
      query.whereIn('vendor_id', vendorIds)
    }

    if (unitId) query.where('unit_id', unitId)
    if (groupId) query.where('group_id', groupId)
    if (validated !== null) {
      if (validated === 1) query.where('validated', true)
      else if (validated === 0) query.where('validated', false)
    }
    if (ticketNumber) query.where('ticket_number', ticketNumber)

    const tickets = await query.orderBy('ticket_number', 'asc').paginate(page, limit)

    const data: any[] = []

    //loop nos tickets
    for (const ticket of tickets) {
      const unit = ticket.unitId ? await Unit.find(ticket.unitId) : null
      const group = ticket.groupId ? await Group.find(ticket.groupId) : null
      const vendor = ticket.vendorId ? await User.find(ticket.vendorId) : null

      // Busca o primeiro WhatsApp message validado (mais antigo) com prefixo AB
      const whatsappMessage = await TicketWhatsappMessage.query()
        .where('ticket_number', `AB${ticket.ticketNumber}`)
        .where('status', 'VALIDATED')
        .orderBy('created_at', 'asc')
        .first()

      const ticketData = {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        unit: unit ? { id: unit.id, name: unit.name } : null,
        group: group ? { id: group.id, name: group.name } : null,
        vendor: vendor ? { id: vendor.id, name: vendor.name, whatsapp: vendor.whatsapp } : null,
        deliveredOn: ticket.deliveredOn,
        validated: ticket.validated,
        validatedOn: ticket.validatedOn, //Preciso de uma biblioteca que subtraia 3 horas aqui
        mirror: ticket.ticketMirror,
        paid: 0, //campo reservado pro futuro
        whatsappSenderNumber: whatsappMessage ? whatsappMessage.senderNumber : null,
        whatsappSenderName: whatsappMessage ? whatsappMessage.senderName : null,
      }

      data.push(ticketData)
    }

    return {
      meta: tickets.getMeta(),
      data: data,
    }
  }

  //Processo o CSV passando ele como parâmetro, e faço a inserção em lote no banco
  static async uploadTicketsNumbersCsv(csvData: string) {
    //Modelo de dados no CSV
    /*
    TICKET_NUMBER,A1,A2,A3,A4,J1,J2,J3,J4,U1,U2,U3,U4,D1,D2,D3,D4,E1,E2,E3,E4
    000001,3,7,9,11,16,24,25,26,32,38,43,45,47,49,52,54,71,72,73,74
    000002,2,5,7,14,16,18,24,28,31,32,42,43,52,54,59,60,62,66,67,69
    000003,3,6,11,15,17,21,26,28,32,41,43,44,46,48,58,59,64,66,67,72
    */

    const lines = csvData
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    if (lines.length < 2) {
      throw new Error('CSV inválido ou vazio')
    }

    const header = lines[0].split(',').map((h) => h.trim())

    // OTIMIZAÇÃO 1: Extrair todos os ticket_numbers do CSV primeiro
    const ticketNumbers: string[] = []
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim())
      if (cols[0]) ticketNumbers.push(cols[0])
    }

    // OTIMIZAÇÃO 2: Buscar todos os tickets em uma única query (ou poucos chunks)
    const ticketMap = new Map<string, number>()
    const SEARCH_CHUNK = 1000

    for (let i = 0; i < ticketNumbers.length; i += SEARCH_CHUNK) {
      const chunk = ticketNumbers.slice(i, i + SEARCH_CHUNK)
      const tickets = await Ticket.query()
        .whereIn('ticket_number', chunk)
        .select(['id', 'ticket_number'])

      tickets.forEach((ticket) => {
        ticketMap.set(ticket.ticketNumber, ticket.id)
      })
    }

    // OTIMIZAÇÃO 3: Processar CSV usando Map (lookup O(1))
    const ticketNumbersPayload: any[] = []
    let skipped = 0

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim())
      const ticketNumber = cols[0]
      const ticketId = ticketMap.get(ticketNumber)

      if (!ticketId) {
        skipped++
        continue
      }

      for (let j = 1; j < cols.length; j++) {
        const headerCol = header[j]
        const value = Number(cols[j])
        if (isNaN(value)) continue
        const letter = headerCol.charAt(0) as 'A' | 'J' | 'U' | 'D' | 'E'
        const position = Number(headerCol.charAt(1))
        ticketNumbersPayload.push({
          tenant_id: 1,
          ticket_id: ticketId,
          ticket_number: ticketNumber,
          letter: letter,
          position: position,
          value: value,
        })
      }
    }

    // OTIMIZAÇÃO 4: Insert em lote (já estava bom, mantido)
    const CHUNK_SIZE = 2000
    for (let i = 0; i < ticketNumbersPayload.length; i += CHUNK_SIZE) {
      const chunk = ticketNumbersPayload.slice(i, i + CHUNK_SIZE)
      const bindings: any[] = []
      const valuesSql: string[] = []
      chunk.forEach((item) => {
        valuesSql.push('(?, ?, ?, ?, ?, ?, NOW(), NOW())')
        bindings.push(
          item.tenant_id,
          item.ticket_id,
          item.ticket_number,
          item.letter,
          item.position,
          item.value
        )
      })
      const sql = `
        INSERT IGNORE INTO ticket_numbers (tenant_id, ticket_id, ticket_number, letter, position, value, created_at, updated_at)
        VALUES ${valuesSql.join(', ')}
      `
      await db.rawQuery(sql, bindings)
    }

    return {
      inserted: ticketNumbersPayload.length,
      skipped: skipped,
      total_csv_lines: lines.length - 1,
    }
  }

  //Serviço de devolução de tickets
  static async returnTickets(params: returnTickets) {
    const { event_id, unit_id, ticket_from, ticket_to, reason } = params

    if (!event_id || !unit_id || !ticket_from || !ticket_to || !reason) {
      throw new Error('event_id, unit_id, ticket_from, ticket_to e reason são obrigatórios')
    }

    if (ticket_from > ticket_to) {
      throw new Error('ticket_from não pode ser maior que ticket_to')
    }

    //O ticket from e ticket_to são strings, preciso parsear eles
    //O formato vem por exemplo "000001" até "000100"
    //No banco, o ticket_number é string também na tabela tickets
    //Então vou fazer a busca direto como string, mas preciso garantir que o range é válido
    //Pego a quantidade de tickets e coloco num total
    //Para cada ticket nesse range, faço a atualização
    //A atualização é entrar na tabela tickets e zerar o vendor_id e delivered_on, group_id e unit_id buscando pelo ticket_number, event_id e tenant_id
    //Se o ticket estiver com validated = true, não deixo devolver esse ticket, mas não gero erro no total, devolvo ele como pulado
    //Nesse mesmo ticket, eu já faço um update da unit_id para o default = 9 (futura variável de configuração) e o delivered_on para now()
    //Para cada ticket devolvido, gero um log na tabela ticket_logs informando o tenant_id, event_id, ticket_id, ticket_number, action = 'ticket_returned', (unit_id, group_id, vendor_id antes da devolução), log = returned, created_at, updated_at
    //Na tabela ticket_returns, gero um registro com tenant_id, event_id, group_id, ticket_from, ticket_to, total, reason, created_at, updated_at
    //No final retorno o total de tickets processados, quantos foram devolvidos e quantos foram pulados
    //Preciso do mais performático possível, então faço em lotes

    const DEFAULT_UNIT_ID = 9
    const TENANT_ID = 1

    const range = this.parseRange(ticket_from, ticket_to)

    let totalProcessed = 0
    let totalReturned = 0
    let totalSkipped = 0

    const skipped = <any>[]

    const CHUNK = this.CHUNK

    for (let i = range.start; i <= range.end; i += CHUNK) {
      const chunkEnd = Math.min(i + CHUNK - 1, range.end)
      const ticketNumbers: string[] = []
      for (let n = i; n <= chunkEnd; n++) {
        ticketNumbers.push(this.padLeft(n, range.width))
      }
      //Busco os tickets nesse chunk
      const tickets = await Ticket.query()
        .where('eventId', event_id)
        //.where('unit_id', unit_id)
        .whereIn('ticket_number', ticketNumbers)

      for (const ticket of tickets) {
        totalProcessed++

        //Vejo se já está no log de devolvido
        const existingLog = await TicketLog.query()
          .where('tenant_id', TENANT_ID)
          .where('event_id', event_id)
          .where('ticket_number', ticket.ticketNumber)
          .where('action', 'ticket_returned')
          .first()

        if (existingLog) {
          skipped.push(ticket.ticketNumber)
          totalSkipped++
          continue
        }

        if (ticket.validated) {
          skipped.push(ticket.ticketNumber)
          totalSkipped++
          continue
        }
        const previousVendorId = ticket.vendorId
        const previousUnitId = ticket.unitId
        const previousGroupId = ticket.groupId

        //Atualizo o ticket
        ticket.vendorId = null
        ticket.deliveredOn = null
        ticket.unitId = DEFAULT_UNIT_ID
        await ticket.save()

        //Log
        await TicketLog.create({
          tenantId: TENANT_ID,
          eventId: event_id,
          ticketNumber: ticket.ticketNumber,
          action: 'ticket_returned',
          unitId: previousUnitId,
          groupId: previousGroupId,
          vendorId: previousVendorId,
          log: { reason },
        })

        totalReturned++
      }
    }

    //Registro a devolução
    await TicketReturn.create({
      tenantId: TENANT_ID,
      eventId: event_id,
      unitId: unit_id,
      ticketFrom: ticket_from,
      ticketTo: ticket_to,
      total: totalReturned,
      reason: reason,
    })

    return {
      total_processed: totalProcessed,
      total_returned: totalReturned,
      skipped: {
        total: totalSkipped,
        ticket_numbers: skipped,
      },
    }
  }

  //Serviço de devolução de tickets por cartela
  static async returnTicketsByBooklet(csv: string) {
    const DEFAULT_UNIT_ID = 9
    const TENANT_ID = 1
    const REASON = 'Devolução por coordenador'
    const EVENT_ID = 1

    if (!csv) {
      throw new Error('csv é obrigatório')
    }

    // Processa o CSV
    const lines: string[] = csv
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
    if (lines.length < 1) {
      throw new Error('CSV inválido ou vazio')
    }

    let totalProcessed = 0
    let totalReturned = 0
    let totalSkipped = 0
    const skipped: string[] = []

    for (const line of lines as string[]) {
      const ticketNumber = line
      // Busca o ticket
      const ticket = await Ticket.query().where('ticket_number', ticketNumber).first()

      if (!ticket) {
        totalSkipped++
        skipped.push(ticketNumber)
        continue
      }

      totalProcessed++
      if (ticket.validated) {
        totalSkipped++
        skipped.push(ticket.ticketNumber)
        continue
      }

      const previousVendorId = ticket.vendorId
      const previousUnitId = ticket.unitId
      const previousGroupId = ticket.groupId

      // Atualiza o ticket
      ticket.vendorId = null
      ticket.deliveredOn = null
      ticket.unitId = DEFAULT_UNIT_ID
      await ticket.save()

      // Log JSON
      await TicketLog.create({
        tenantId: TENANT_ID,
        eventId: EVENT_ID,
        ticketNumber: ticket.ticketNumber,
        action: 'ticket_returned',
        unitId: previousUnitId,
        groupId: previousGroupId,
        vendorId: previousVendorId,
        log: { REASON },
      })

      totalReturned++
    }

    return {
      total_processed: totalProcessed,
      total_returned: totalReturned,
      skipped: {
        total: totalSkipped,
        ticket_numbers: skipped,
      },
    }
  }

  //Contagem de ticket por chave
  static async countTicketsByKey(
    keysOrObj:
      | Array<'unit_id' | 'group_id' | 'vendor_id' | 'validated'>
      | Record<string, number | string | boolean | Array<number | string | boolean>>,
    valuesOrLog?: Record<string, Array<number | string | boolean>> | boolean,
    logParam?: boolean
  ) {
    let table = 'tickets'
    let keys: string[] = []
    let values: Record<string, Array<number | string | boolean>> = {}
    let log = false

    if (Array.isArray(keysOrObj)) {
      // Chamada antiga: (keys, values, log)
      keys = keysOrObj
      values = (valuesOrLog as Record<string, Array<number | string | boolean>>) || {}
      log = logParam ?? false
    } else if (typeof keysOrObj === 'object' && keysOrObj !== null) {
      // Nova chamada: (obj, log?)
      keys = Object.keys(keysOrObj)
      for (const k of keys) {
        const v = keysOrObj[k]
        values[k] = Array.isArray(v) ? v : [v]
      }
      log = typeof valuesOrLog === 'boolean' ? valuesOrLog : false
    } else {
      throw new Error('Parâmetros inválidos para countTicketsByKey')
    }

    if (keys.length === 0) {
      throw new Error('Informe ao menos uma key para agrupar')
    }

    if (log) {
      table = 'ticket_logs'
    } else {
      table = 'tickets_pirapora'
    }

    let query = log
      ? db.from(table).count('* as total')
      : db.connection('secondary').from(table).count('* as total')

    for (const k of keys) {
      if (values[k] && values[k].length > 0) {
        query = query.whereIn(k, values[k])
      }
    }

    const rows: Array<any> = await query
    // Sempre retorna apenas o total geral
    return Number(rows[0]?.total ?? 0)
  }
}
