import User from '#models/user'
import Group from '#models/group'
import VendorStatsService from '#services/vendor_stats_service'
import NotificationService from '#services/notifications_service'
//import GroupService from '#services/group_service'
import type { HttpContext } from '@adonisjs/core/http'
import Ticket from '#models/ticket'
import env from '#start/env'

export default class VendorsController {
  //Get vendors
  async index({ request }: HttpContext) {
    const payload = {
      page: request.input('page', 1),
      limit: request.input('limit', 20),

      vendorName: request.input('vendor_name'),
      vendorWhatsapp: request.input('vendor_whatsapp'),

      unitIdSearch: request.input('unit_id_search'),
      groupIdSearch: request.input('group_id_search'),
    }

    return VendorStatsService.listVendorsWithStats(payload)
  }

  //Create a vendor
  async store({ request }: HttpContext) {
    // 1. Defina um validador (recomendado) ou pegue o payload
    const data = request.only(['vendor_name', 'vendor_whatsapp', 'ticket_from', 'ticket_to'])

    // 2. Crie uma nova estrutura (spread operator) para adicionar campos extras
    const payload = {
      ...data,
      vendor_whatsapp: '55' + data.vendor_whatsapp.replace(/\D/g, ''),
      unit_id: '6',
      group_name: 'Rodeio',
    }

    const userPass = '123456' //Senha padrão

    const vendor = {
      name: payload.vendor_name,
      whatsapp: payload.vendor_whatsapp,
      password: userPass,
      role: 'vendor',
      tenant_id: 1,
    }

    try {
      const user = await User.create(vendor)

      // ✅ Service: cria paróquia e atualiza range das cartelas
      const rangeResult = await VendorStatsService.createGroupAndAssignTickets({
        eventId: env.get('DEFAULT_EVENT_ID') as number,
        unitId: Number(payload.unit_id),
        groupName: payload.group_name,
        managerId: user.id,
        ticketFrom: payload.ticket_from,
        ticketTo: payload.ticket_to,
      })

      if (!rangeResult.success) {
        return {
          success: false,
          message: rangeResult.message,
          error: rangeResult.error,
        }
      }

      const group = rangeResult.group

      // ✅ Service: notificação (WhatsApp) - em background, não bloqueia resposta
      NotificationService.vendorCreated({
        vendorName: payload.vendor_name,
        vendorWhatsapp: payload.vendor_whatsapp,
        ticketFrom: payload.ticket_from,
        ticketTo: payload.ticket_to,
        groupName: payload.group_name,
        unitId: Number(payload.unit_id),
        imageUrl: env.get('VENDOR_HELP_GUID_IMAGE'),
      }).catch((error) => {
        console.error('Erro ao enviar notificação de vendedor criado:', error)
      })

      return {
        success: true,
        data: vendor,
        group_id: group.id,
      }
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        return {
          success: false,
          message: 'Já existe um vendedor com esse número de WhatsApp cadastrado.',
        }
      }

      return {
        success: false,
        message: 'Erro ao criar o vendedor. Contate o suporte.',
        error: error?.message ?? String(error),
      }
    }
  }

  async show({ params }: HttpContext) {
    return VendorStatsService.getVendorWithStats(Number(params.id))
  }

  //Excluir vendedor
  async destroy({ params }: HttpContext) {
    try {
      const vendor = await User.findOrFail(params.id)

      await vendor.delete()

      //Remover vinculo do vendedor nas cartelas
      await Ticket.query()
        .where('vendor_id', params.id)
        .update({ vendor_id: null, group_id: null, delivered_on: null })

      //Remover paróquia vinculada ao vendedor
      await Group.query().where('manager_id', params.id).delete()

      return { success: true, message: 'Vendedor excluído com sucesso.' }
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao excluir o vendedor. Contate o suporte.',
        error: error.message,
      }
    }
  }

  //Atualizar range vendedor
  async updateRange({ params, request }: HttpContext) {
    const data = request.only(['ticket_from', 'ticket_to'])

    const payload = {
      ...data,
      unit_id: 1,
      group_name: 'Rodeio',
    }

    try {
      // ✅ Service: cria paróquia e atualiza range das cartelas
      const rangeResult = await VendorStatsService.createGroupAndAssignTickets({
        eventId: env.get('DEFAULT_EVENT_ID') as number,
        unitId: Number(payload.unit_id),
        groupName: payload.group_name,
        managerId: params.id,
        ticketFrom: payload.ticket_from,
        ticketTo: payload.ticket_to,
      })

      if (!rangeResult.success) {
        return {
          success: false,
          message: rangeResult.message,
          error: rangeResult.error,
        }
      }

      const group = rangeResult.group

      // ✅ Service: notificação (WhatsApp) - em background, não bloqueia resposta
      NotificationService.vendorUpdatedRange({
        vendorId: Number(params.id),
        ticketFrom: payload.ticket_from,
        ticketTo: payload.ticket_to,
        groupName: payload.group_name,
        unitId: Number(payload.unit_id),
      }).catch((error) => {
        console.error('Erro ao enviar notificação de atualização de range:', error)
      })

      return {
        success: true,
        data: rangeResult,
        group_id: group.id,
      }
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao atualizar o range de cartelas. Contate o suporte.',
        error: error.message,
      }
    }
  }

  //Obter range vendedor
  async getRange({ params }: HttpContext) {
    return VendorStatsService.getRange({
      vendorId: Number(params.id),
    })
  }

  //Tickets desse venededor
  async tickets({ params }: HttpContext) {
    return VendorStatsService.listTicketsOfVendor(params.id)
  }
}
