import Unit from '#models/unit'
import User from '#models/user'
import WapiService from '#services/messages_service'
import VendorStatsService from './vendor_stats_service.js'

type VendorCreatedInput = {
  vendorName: string
  vendorWhatsapp: string
  ticketFrom: string
  ticketTo: string
  groupName: string
  unitId: number
  imageUrl?: string
}

type VendorUpdatedRange = {
  vendorId: number
  ticketFrom: string
  ticketTo: string
  groupName: string
  unitId: number
}


type OtpResetPassword = {
  whatsapp: string
  code: string,
  purpose?: string,
}


type requestTicketRegistration = {
  vendorId: number
}

export default class NotificationService {

  static async vendorCreated(input: VendorCreatedInput) {
    const unit = await Unit.findBy('id', input.unitId)
    const unitName = unit?.name ?? 'Nome da comunidade'

    const message = `Olá ${input.vendorName}!,

Você foi cadastrado(a) como vendedor(a) das cartelas *${input.ticketFrom} - ${input.ticketTo}* da pastoral *${input.groupName}* da Comunidade *${unitName}*.
Segue abaixo as instruções de como enviar os canhotos. Qualquer dúvida é só chamar!`

    await WapiService.sendWhatsappText({
      phone: input.vendorWhatsapp,
      message,
    })

    if (input.imageUrl) {
      await WapiService.sendWhatsappImage({
        phone: input.vendorWhatsapp,
        imageUrl: input.imageUrl,
      })
    }
  }

  static async vendorUpdatedRange(input: VendorUpdatedRange) {
    const user = await User.findBy('id', input.vendorId)
    if (!user) {
      throw new Error('Usuário não encontrado para notificação de atualização de range')
    }
    if (!user.whatsapp) {
      throw new Error('Usuário sem número de WhatsApp para notificação')
    }
    const unit = await Unit.findBy('id', input.unitId)
    const unitName = unit?.name ?? 'Nome da comunidade'

    const message = `Olá ${user.name}!,

Você foi cadastrado(a) como vendedor(a) das cartelas *${input.ticketFrom} - ${input.ticketTo}* da pastoral *${input.groupName}* da Comunidade *${unitName}*.`

    await WapiService.sendWhatsappText({
      phone: user.whatsapp,
      message,
    })

  }

  static async requestTicketRegistration(input: requestTicketRegistration) {
    const user = await VendorStatsService.getVendorWithStats(input.vendorId)

    if (!user.success) {
      throw new Error('Usuário não encontrado para notificação de solicitação de registro de cartelas')
    }

    const vendorRange = await VendorStatsService.getRange({ vendorId: input.vendorId })

    if (!vendorRange.success) {
      throw new Error('Range do vendedor não encontrado para notificação de solicitação de registro de cartelas')
    }

    // monta bullets de groups + ranges
    const groupsText = vendorRange.data.groups
      .map((g) => {
        const header = `• ${g.unit_name ?? 'Comunidade'} - ${g.group_name ?? 'Pastoral'}`
        const ranges = (g.ranges ?? [])
          .map((r) => `  - ${r.ticket_from} a ${r.ticket_to} (${r.total})`)
          .join('\n')

        return ranges ? `${header}\n${ranges}` : header
      })
      .join('\n\n')

    const message = `Olá *${user.data.name}*!,

Você foi cadastrado(a) como vendedor(a) de *${user.data.tickets_total}* cartelas e só enviou até o momento os canhotos de *${user.data.tickets_verified}*, o que representa *${user.data.tickets_verified_percentage}%*.

O dia do sorteio está chegando — agilize o envio.

Segue abaixo a lista das suas cartelas:

${groupsText}`

    await WapiService.sendWhatsappText({
      phone: user.data.whatsapp,
      message,
    })

    return { success: true }
  }

  //Código OTP para reset de senha
  static async sendOtpResetPassword(input: OtpResetPassword) {

    let message = '';

    if (input.purpose === 'password_reset') {
      message = `Seu código para alterar sua senha no sistema é: *${input.code}*`;
    } else {
      message = `Seu código é: *${input.code}*`;
    }

    try {
      await WapiService.sendWhatsappOTP({
        phone: input.whatsapp,
        message,
        code: input.code
      });

      return { success: true };
    } catch (error) {
      return { success: false, message: 'Erro ao enviar código OTP. Verifique o número de WhatsApp.', error: error.message };
    }

  }


}
