import Ticket from '#models/ticket'
import Group from '#models/group'
import Unit from '#models/unit'
import User from '#models/user';
import db from '@adonisjs/lucid/services/db';
import TicketsService from '#services/tickets_service'

type ListVendorsWithStatsInput = {
  page?: number
  limit?: number
  vendorName?: string | null
  vendorWhatsapp?: string | null
  unitIdSearch?: number | string | null
  groupIdSearch?: number | string | null
}

type VendorWithStatsResult =
  | { success: true; data: any }
  | { success: false; message: string; error?: string }

type CreateGroupAndAssignTicketsInput = {
  eventId: number
  unitId: number
  groupName: string
  managerId: number // vendorId (user.id)
  ticketFrom: string
  ticketTo: string
}

type CreateGroupAndAssignTicketsResult =
  | { success: true; group: Group }
  | { success: false; message: string; error?: string }


type GetRangeInput = {
  vendorId: number
}

type RangeItem = { ticket_from: string; ticket_to: string; total: number }

type GroupRangeItem = {
  unit_id: number | null
  unit_name: string | null
  group_id: number | null
  group_name: string | null
  ranges: RangeItem[]
}

type GetRangeResult =
  | { success: true; data: { groups: GroupRangeItem[] } }
  | { success: false; message: string; error?: string }

export default class VendorRangeService {

  static async listVendorsWithStats(input: ListVendorsWithStatsInput) {
    const page = input.page ?? 1
    const limit = input.limit ?? 20

    const vendorName = input.vendorName ?? null
    let vendorWhatsapp = input.vendorWhatsapp ?? null

    const unitIdSearch = input.unitIdSearch ?? null
    const groupIdSearch = input.groupIdSearch ?? null

    const query = User.query()
      .select(['id', 'name', 'whatsapp'])
      .where('role', 'vendor')

    if (vendorName) {
      query.where('name', 'like', `%${vendorName}%`)
    }

    if (vendorWhatsapp) {
      vendorWhatsapp = '55' + String(vendorWhatsapp).replace(/\D/g, '')
      query.where('whatsapp', vendorWhatsapp)
    }

    if (groupIdSearch || unitIdSearch) {
      const groupQuery = Group.query().select('manager_id')

      if (groupIdSearch) {
        groupQuery.where('id', groupIdSearch)
      }

      if (unitIdSearch) {
        groupQuery.where('unit_id', unitIdSearch)
      }

      const groups = await groupQuery

      const managerIds = groups
        .map((group) => group.managerId)
        .filter((id): id is number => Boolean(id))

      if (managerIds.length > 0) {
        query.whereIn('id', managerIds)
      } else {
        query.whereRaw('1 = 0')
      }
    }

    const vendors = await query.orderBy('id', 'desc').paginate(page, limit)

    const rows = vendors.all()
    const vendorIds = rows.map((vendor) => vendor.id)

    const ticketCountsByVendor = new Map<number, number>()
    const verifiedCountsByVendor = new Map<number, number>()

    if (vendorIds.length > 0) {
      const totalRows = await db
        .connection('secondary')
        .from('tickets_rodeio')
        .select('vendor_id')
        .count('* as total')
        .whereIn('vendor_id', vendorIds)
        .groupBy('vendor_id')

      for (const row of totalRows as Array<{ vendor_id: number; total: string | number }>) {
        ticketCountsByVendor.set(Number(row.vendor_id), Number(row.total))
      }

      const verifiedRows = await db
        .connection('secondary')
        .from('tickets_rodeio')
        .select('vendor_id')
        .count('* as total')
        .whereIn('vendor_id', vendorIds)
        .where('validated', 1)
        .groupBy('vendor_id')

      for (const row of verifiedRows as Array<{ vendor_id: number; total: string | number }>) {
        verifiedCountsByVendor.set(Number(row.vendor_id), Number(row.total))
      }
    }

    const data: any[] = []

    for (const vendor of rows) {
      const group = await Group.query()
        .select('unit_id', 'name')
        .where('manager_id', vendor.id)
        .first()

      let unit: Unit | null = null

      if (group && group.unitId) {
        unit = await Unit.query().select('name').where('id', group.unitId).first()
      }

      const ticketCount = ticketCountsByVendor.get(vendor.id) ?? 0
      const verifiedCount = verifiedCountsByVendor.get(vendor.id) ?? 0
      const verifiedPercentage = ticketCount ? Number(((verifiedCount / ticketCount) * 100).toFixed(2)) : 0

      data.push({
        ...vendor.serialize(),
        unit: unit?.name ?? null,
        group: group?.name ?? null,
        tickets_total: ticketCount,
        tickets_verified: verifiedCount,
        tickets_verified_percentage: verifiedPercentage,
      })
    }

    return {
      meta: vendors.getMeta(),
      data,
    }
  }


  //Vendor With Status
  static async getVendorWithStats(vendorId: number): Promise<VendorWithStatsResult> {
    try {
      const vendor = await User.query()
        .select(['id', 'name', 'whatsapp'])
        .where('role', 'vendor')
        .where('id', vendorId)
        .first()

      if (!vendor) {
        return { success: false, message: 'Vendedor não encontrado.' }
      }

      // tickets_total e tickets_verified (mesma lógica do index)
      const totalRow = await db
        .connection('secondary')
        .from('tickets_rodeio')
        .where('vendor_id', vendor.id)
        .count('* as total')
        .first()

      const verifiedRow = await db
        .connection('secondary')
        .from('tickets_rodeio')
        .where('vendor_id', vendor.id)
        .where('validated', 1)
        .count('* as total')
        .first()

      const ticketCount = Number((totalRow as any)?.total ?? 0)
      const verifiedCount = Number((verifiedRow as any)?.total ?? 0)

      const verifiedPercentage = ticketCount
        ? Number(((verifiedCount / ticketCount) * 100).toFixed(2))
        : 0

      // group + unit (mesma lógica do index)
      const group = await Group.query()
        .select('unit_id', 'name')
        .where('manager_id', vendor.id)
        .first()

      let unit: Unit | null = null
      if (group && group.unitId) {
        unit = await Unit.query().select('name').where('id', group.unitId).first()
      }

      return {
        success: true,
        data: {
          ...vendor.serialize(),
          unit: unit?.name ?? null,
          group: group?.name ?? null,
          tickets_total: ticketCount,
          tickets_verified: verifiedCount,
          tickets_verified_percentage: verifiedPercentage,
        },
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao buscar dados do vendedor. Contate o suporte.',
        error: error?.message ?? String(error),
      }
    }
  }

  
  static async getRange(input: GetRangeInput): Promise<GetRangeResult> {
    try {
      const tickets = await Ticket.query()
        .select(['ticket_number', 'group_id'])
        .where('vendor_id', input.vendorId)

      if (tickets.length === 0) {
        return {
          success: true,
          data: { groups: [] },
        }
      }

      // agrupa tickets por group_id
      const ticketsByGroup = new Map<number | null, Array<{ ticketNumber: string; numeric: number }>>()

      for (const ticket of tickets) {
        const groupId = ticket.groupId ?? null
        const list = ticketsByGroup.get(groupId) ?? []

        list.push({
          ticketNumber: ticket.ticketNumber,
          numeric: Number(ticket.ticketNumber),
        })

        ticketsByGroup.set(groupId, list)
      }

      const groups: GroupRangeItem[] = []

      // cache pra evitar queries repetidas
      const groupCache = new Map<number, Group | null>()
      const unitCache = new Map<number, Unit | null>()

      const getGroupCached = async (id: number) => {
        if (groupCache.has(id)) return groupCache.get(id) ?? null
        const g = await Group.findBy('id', id)
        groupCache.set(id, g ?? null)
        return g ?? null
      }

      const getUnitCached = async (id: number) => {
        if (unitCache.has(id)) return unitCache.get(id) ?? null
        const u = await Unit.findBy('id', id)
        unitCache.set(id, u ?? null)
        return u ?? null
      }

      for (const [groupId, list] of ticketsByGroup) {
        const sorted = list.sort((a, b) => a.numeric - b.numeric)

        const ranges: RangeItem[] = []
        let current: { from: string; to: string; last: number } | null = null

        for (const ticket of sorted) {
          if (!current) {
            current = {
              from: ticket.ticketNumber,
              to: ticket.ticketNumber,
              last: ticket.numeric,
            }
            continue
          }

          const isConsecutive = ticket.numeric === current.last + 1

          if (isConsecutive) {
            current.to = ticket.ticketNumber
            current.last = ticket.numeric
          } else {
            ranges.push({
              ticket_from: current.from,
              ticket_to: current.to,
              total: Number(current.to) - Number(current.from) + 1,
            })

            current = {
              from: ticket.ticketNumber,
              to: ticket.ticketNumber,
              last: ticket.numeric,
            }
          }
        }

        if (current) {
          ranges.push({
            ticket_from: current.from,
            ticket_to: current.to,
            total: Number(current.to) - Number(current.from) + 1,
          })
        }

        let unitName: string | null = null
        let unitId: number | null = null
        let groupName: string | null = null

        if (groupId) {
          const group = await getGroupCached(groupId)
          if (group) {
            groupName = group.name ?? null

            if (group.unitId) {
              const unit = await getUnitCached(group.unitId)
              unitName = unit?.name ?? null
              unitId = unit?.id ?? null
            }
          }
        }

        groups.push({
          unit_id: unitId,
          unit_name: unitName,
          group_id: groupId,
          group_name: groupName,
          ranges,
        })
      }

      return {
        success: true,
        data: { groups },
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Erro ao obter o range de cartelas. Contate o suporte.',
        error: error?.message ?? String(error),
      }
    }
  }

  static async createGroupAndAssignTickets(
    input: CreateGroupAndAssignTicketsInput
  ): Promise<CreateGroupAndAssignTicketsResult> {
    try {
      // console.log('📍 Creating group with input:', input)

      // cria a paróquia (group)
      const group = await Group.create({
        name: input.groupName,
        unitId: input.unitId,
        managerId: input.managerId,
      })
      // console.log('✅ Group created successfully:', { groupId: group.id, groupName: group.name })

      // vincula as cartelas ao vendor + group
      // console.log('📍 Starting bulk edit with params:', {
      //   event: input.eventId,
      //   from: input.ticketFrom,
      //   to: input.ticketTo,
      //   vendorId: input.managerId,
      //   groupId: group.id,
      // })

      await TicketsService.bulkEdit({
        event: input.eventId,
        from: input.ticketFrom,
        to: input.ticketTo,
        vendorId: input.managerId,
        groupId: group.id,
      })

      return { success: true, group }
    } catch (error: any) {
      // console.error('❌ Error in createGroupAndAssignTickets:', {
      //   message: error?.message,
      //   code: error?.code,
      //   errno: error?.errno,
      //   sql: error?.sql,
      //   stack: error?.stack,
      // })
      // mantém a mesma semântica de erro que você tinha
      return {
        success: false,
        message:
          'O vendedor foi criado, mas houve um erro ao criar a paróquia ou atualizar as cartelas. Contate o suporte.',
        error: `${error?.message} (${error?.code || 'UNKNOWN'})`,
      }
    }
  }

  //Tickets de um vendedor
  static async listTicketsOfVendor(vendorId: number): Promise<any[]> {
    const tickets = await Ticket.query()
      .where('vendor_id', vendorId)
      .orderBy('ticket_number', 'asc')

    let allTickets = [];

    for(const ticket of tickets){

      let ticketData = {
        id: ticket.id,
        ticket_number: ticket.ticketNumber,
        validated: ticket.validated,
        delivered_on: ticket.deliveredOn,
        paid: 0
      }

      allTickets.push(ticketData);

    }

    return allTickets

  }
}
