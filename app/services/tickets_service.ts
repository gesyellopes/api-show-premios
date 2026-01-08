// app/services/tickets_service.ts
import db from '@adonisjs/lucid/services/db'
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
}
