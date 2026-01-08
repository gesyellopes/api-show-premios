import User from '#models/user';
import Group from '#models/group';
import Database from '@adonisjs/lucid/services/db'
import TicketsService from '#services/tickets_service'
import GroupService from '#services/group_service'
import type { HttpContext } from '@adonisjs/core/http'
import WapiService from '#services/messages_service';
import Hash from '@adonisjs/core/services/hash';

export default class VendorsController {

    //Get vendors
    async index() {
        const vendors = await User.query().where('role', 'vendor')

        const rawVendors = []

        for (const vendor of vendors) {
            const groupVendor = await GroupService.getByManagerId(vendor.id)

            rawVendors.push({
                ...vendor.serialize(),
                groups: groupVendor,
            })
        }

        return rawVendors
    }


    //Create a vendor
    async store({ request, response }: HttpContext) {
        const payload = request.only([
            'unit_id',
            'group_name',
            'vendor_name',
            'vendor_whatsapp',
            'tickets_from',
            'tickets_to',
        ])

        // Validações mínimas (ideal: use Vine validator, mas aqui já ajuda)
        if (
            !payload.unit_id ||
            !payload.group_name ||
            !payload.vendor_name ||
            !payload.vendor_whatsapp ||
            payload.tickets_from === undefined ||
            payload.tickets_to === undefined
        ) {
            return response.badRequest({
                success: false,
                message: 'Campos obrigatórios: unit_id, group_name, vendor_name, vendor_whatsapp, tickets_from, tickets_to',
            })
        }

        // Normalização (bem útil pra evitar duplicidade por formato)
        const whatsapp = String(payload.vendor_whatsapp).replace(/\D/g, '') // só números
        const ticketsFrom = payload.tickets_from
        const ticketsTo = payload.tickets_to

        if (Number.isNaN(ticketsFrom) || Number.isNaN(ticketsTo)) {
            return response.badRequest({ success: false, message: 'tickets_from e tickets_to devem ser numéricos' })
        }

        if (ticketsFrom > ticketsTo) {
            return response.badRequest({ success: false, message: 'tickets_from não pode ser maior que tickets_to' })
        }

        // ⚠️ Melhor do que senha fixa. (Pode trocar por OTP depois)
        const tempPassword = '123456'
        const hashedPassword = await Hash.make(tempPassword)

        let createdUser: User
        let createdGroup: Group

        try {
            // 1) Transação: user + group + update tickets (tudo ou nada)
            await Database.transaction(async (trx) => {
                createdUser = await User.create(
                    {
                        name: payload.vendor_name,
                        whatsapp,
                        password: hashedPassword,
                        role: 'vendor',
                        tenantId: 1,
                    },
                    { client: trx }
                )

                createdGroup = await Group.create(
                    {
                        name: payload.group_name,
                        unitId: payload.unit_id,
                        managerId: createdUser.id,
                    },
                    { client: trx }
                )

                // ✅ OPÇÃO A (ideal): TicketsService aceita trx
                const tickets = await TicketsService.bulkEdit({
                    event: 1,
                    from: ticketsFrom,
                    to: ticketsTo,
                    vendorId: createdUser.id,
                    groupId: createdGroup.id,
                    // trx, // <- se seu service suportar
                })

                // ✅ OPÇÃO B: se o TicketsService NÃO suporta trx,
                // você deveria mover o update pra cá usando query builder com trx
                // (ou adaptar o service pra receber trx).
            })

            // 2) Fora da transação: notificação (não pode “desfazer” cadastro se falhar WhatsApp)
            const message = `Olá ${payload.vendor_name}!

Você foi cadastrado(a) como vendedor(a) das cartelas *${ticketsFrom} - ${ticketsTo}* da pastoral *${payload.group_name}* da Comunidade *nome comunidade*.

Segue abaixo as instruções de como enviar os canhotos. Qualquer dúvida é só chamar!`

            // Se falhar o WhatsApp, não derruba o cadastro: só registra e retorna sucesso com aviso.
            try {
                await WapiService.sendWhatsappText({
                    phone: whatsapp,
                    message,
                })
            } catch (e) {
                // Aqui ideal é logar: logger.warn({ err: e, userId: createdUser.id }, 'WhatsApp failed')
                return response.ok({
                    success: true,
                    data: {
                        user: createdUser.serialize(),
                        group: createdGroup.serialize(),
                        tickets: tickets
                    },
                    warning: 'Cadastro concluído, mas falhou o envio do WhatsApp. Reenvie manualmente.',
                })
            }

            // 3) Retorno limpo (não devolve senha hash)
            return response.ok({
                success: true,
                data: {
                    user: createdUser.serialize(),
                    group: createdGroup.serialize(),
                    tickets: tickets
                },
            })
        } catch (error: any) {
            // Duplicidade (MySQL)
            if (error?.code === 'ER_DUP_ENTRY') {
                return response.conflict({
                    success: false,
                    message: 'Já existe um vendedor com esse número de WhatsApp cadastrado.',
                })
            }

            // Aqui você pode diferenciar erros por tipo/mensagem também
            return response.internalServerError({
                success: false,
                message: 'Erro ao criar o vendedor. Contate o suporte.',
            })
        }
    }

    async show({ params }: HttpContext) {
        return User.findOrFail(params.id)
    }

}