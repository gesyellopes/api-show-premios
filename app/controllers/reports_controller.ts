// import type { HttpContext } from '@adonisjs/core/http'
import Ticket from '#models/ticket'
import User from '#models/user'
import Unit from '#models/unit'
import Group from '#models/group'
import db from '@adonisjs/lucid/services/db'
import { DateTime } from 'luxon'

export default class ReportsController {
  // Indicadores básicos sobre as cartelas
  async kpis() {
    const [{ $extras: vendorsExtras }] = await User.query()
      .where('role', 'vendor')
      .count('* as total')

    const [{ $extras: ticketsExtras }] = await Ticket.query().count('* as total')

    const [{ $extras: validatedExtras }] = await Ticket.query()
      .whereNotNull('validated_on')
      .count('* as total')

    return {
      total_vendors: Number(vendorsExtras.total),
      total_tickets: Number(ticketsExtras.total),
      total_validated_tickets: Number(validatedExtras.total),
      total_fianncial: Number(0),
    }
  }

  async validationReport() {
    const start = DateTime.now().startOf('day').minus({ days: 6 })
    const end = DateTime.now().endOf('day')

    const rows = await db
      .connection('secondary')
      .from('tickets_buritizeiro')
      .select(db.raw('DATE(validated_on) as date'))
      .count('* as total')
      .whereNotNull('validated_on')
      .whereBetween('validated_on', [
        start.toFormat('yyyy-LL-dd HH:mm:ss'),
        end.toFormat('yyyy-LL-dd HH:mm:ss'),
      ])
      .groupBy('date')
      .orderBy('date', 'asc')

    const countsByDate = new Map<string, number>()
    for (const row of rows as Array<{ date: string | Date; total: string | number }>) {
      const key =
        row.date instanceof Date
          ? DateTime.fromJSDate(row.date).toFormat('dd/LL/yyyy')
          : String(row.date)
      countsByDate.set(key, Number(row.total))
    }

    const result: Array<{ date: string; total: number }> = []
    for (let i = 0; i < 7; i++) {
      const day = start.plus({ days: i })
      const key = day.toFormat('dd/LL/yyyy')

      result.push({
        date: key,
        total: countsByDate.get(key) ?? 0,
      })
    }

    return result
  }

  async financialReport() {
    /*

        1) Busco todos os as units (Comunidades)
[
    2) Para cada comunidade faço o loop
    {
        name (unit.name): Nome da comunidade,
        manager: { //Busco na tabela user pela chave unit.manager_id
            name (user.name): Nome do responsavel,
            whatsapp (user.whatsapp): Whatsapp responsavel
        },
        tickets: { //Busco na tabela tickets where unit_id = unit.id
            total (tickets[count]): quantidade de tickets para essa comunidade,
            verified (tickets = verified and unit_id = unit.id): quantidade de tickets validados para essa comunidade
        },
        vendedores: quantidade de vendedores //Conto na tabela ´group´ a quantidade quando unit_id = unit.id
        paroquias: [ //Busco na tabela `group´ um loop para cada registro quando unid_id = unit.id
            {
                name (group.name): nome da paróquia,
                tickets: {
                    total: quantidade de tickets para essa paróquia, //Busco na tabela tickets where grou_id = group.id
                    verified: quantidade de tickets validados para essa paróquia //Busco na tabela tickets where grou_id = group.id AND validated = 1
                },
                vendor: { //Busco na tabela user pela chave group.manager_id
                    name (user.name): Nome do responsavel, 
                    whatsapp (user.whatsapp): Whatsapp responsavel
                }
            }
        ]
    }
]

Exemplo de retorno:

        [
    {
        name (user.name): Nome da comunidade,
        manager: {
            name (user.name): Nome do responsavel,
            whatsapp (user.whatsapp): Whatsapp responsavel
        },
        tickets: {
            total: quantidade de tickets para essa comunidade,
            verified: quantidade de tickets validados para essa comunidade
        },
        vendedores: quantidade de vendedores
        paroquias: [
            {
                name: nome da paróquia,
                tickets: {
                    total: quantidade de tickets para essa paróquia,
                    verified: quantidade de tickets validados para essa paróquia
                },
                vendor: {
                    name: Nome do responsavel,
                    whatsapp: Whatsapp responsavel
                }
            }
        ]
    }
]
        */

    const units = await Unit.query().orderBy('id', 'asc')
    if (units.length === 0) {
      return []
    }

    const unitIds = units.map((unit) => unit.id)

    const groups = await Group.query().whereIn('unit_id', unitIds).orderBy('id', 'asc')

    const groupIds = groups.map((group) => group.id)

    const managerIds = new Set<number>()
    for (const unit of units) {
      if (unit.managerId) {
        managerIds.add(unit.managerId)
      }
    }
    for (const group of groups) {
      if (group.managerId) {
        managerIds.add(group.managerId)
      }
    }

    const managers = managerIds.size
      ? await User.query().whereIn('id', Array.from(managerIds)).select(['id', 'name', 'whatsapp'])
      : []

    const managerById = new Map<number, { id: number; name: string; whatsapp: string | null }>()
    for (const manager of managers) {
      managerById.set(manager.id, {
        id: manager.id,
        name: manager.name,
        whatsapp: manager.whatsapp ?? null,
      })
    }

    const groupTicketTotals = new Map<number, number>()
    const groupTicketValidated = new Map<number, number>()

    if (groupIds.length > 0) {
      const groupTotalRows = await db
        .from('tickets')
        .select('group_id')
        .count('* as total')
        .whereIn('group_id', groupIds)
        .groupBy('group_id')

      for (const row of groupTotalRows as Array<{ group_id: number; total: string | number }>) {
        groupTicketTotals.set(Number(row.group_id), Number(row.total))
      }

      const groupValidatedRows = await db
        .from('tickets')
        .select('group_id')
        .count('* as total')
        .whereIn('group_id', groupIds)
        .whereNotNull('validated_on')
        .groupBy('group_id')

      for (const row of groupValidatedRows as Array<{ group_id: number; total: string | number }>) {
        groupTicketValidated.set(Number(row.group_id), Number(row.total))
      }
    }

    const groupsByUnit = new Map<number, Group[]>()
    for (const group of groups) {
      if (group.unitId) {
        const list = groupsByUnit.get(group.unitId) ?? []
        list.push(group)
        groupsByUnit.set(group.unitId, list)
      }
    }

    return units.map((unit) => {
      const manager = unit.managerId ? (managerById.get(unit.managerId) ?? null) : null
      const unitGroups = groupsByUnit.get(unit.id) ?? []

      // Consolidate vendors with multiple groups
      const vendorMap = new Map<
        number | null,
        {
          groupNames: string[]
          ticketsTotal: number
          ticketsVerified: number
          vendorId: number | null
        }
      >()

      let unitTotalTickets = 0
      let unitVerifiedTickets = 0

      for (const group of unitGroups) {
        const vendorId = group.managerId
        const groupTotal = groupTicketTotals.get(group.id) ?? 0
        const groupVerified = groupTicketValidated.get(group.id) ?? 0

        unitTotalTickets += groupTotal
        unitVerifiedTickets += groupVerified

        const existing = vendorMap.get(vendorId)
        if (existing) {
          existing.groupNames.push(group.name)
          existing.ticketsTotal += groupTotal
          existing.ticketsVerified += groupVerified
        } else {
          vendorMap.set(vendorId, {
            groupNames: [group.name],
            ticketsTotal: groupTotal,
            ticketsVerified: groupVerified,
            vendorId,
          })
        }
      }

      const paroquias = Array.from(vendorMap.values()).map((vendorData) => {
        const vendor = vendorData.vendorId ? (managerById.get(vendorData.vendorId) ?? null) : null

        return {
          name: vendorData.groupNames[0],
          tickets: {
            total: vendorData.ticketsTotal,
            verified: vendorData.ticketsVerified,
          },
          vendor: vendor ? { name: vendor.name, whatsapp: vendor.whatsapp } : null,
        }
      })

      return {
        name: unit.name,
        manager: manager ? { name: manager.name, whatsapp: manager.whatsapp } : null,
        tickets: {
          total: unitTotalTickets,
          verified: unitVerifiedTickets,
        },
        vendedores: vendorMap.size,
        paroquias,
      }
    })
  }
}
