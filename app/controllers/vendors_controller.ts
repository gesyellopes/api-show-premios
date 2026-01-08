import User from '#models/user';
import Group from '#models/group';
import Unit from '#models/unit';
import TicketsService from '#services/tickets_service'
//import GroupService from '#services/group_service'
import type { HttpContext } from '@adonisjs/core/http'
import WapiService from '#services/messages_service';
import Hash from '@adonisjs/core/services/hash';
import Ticket from '#models/ticket';

export default class VendorsController {

    //Get vendors
    async index({ request }: HttpContext) {

        const page = request.input('page', 1)
        const limit = request.input('limit', 20)

        const vendors = await User.query().select(['id', 'name', 'whatsapp']).where('role', 'vendor').orderBy('id', 'desc').paginate(page, limit);

        const rows = vendors.all();
        const data = [];

        for (const vendor of rows) {

            const group = await Group.query().select('unit_id', 'name').where('manager_id', vendor.id).first();
            let unit = null;

            if (group) {
                unit = await Unit.query().select('name').where('id', group.unitId).first();
            }

            data.push({
                ...vendor.serialize(),
                unit: unit?.name ?? null,
                group: group?.name ?? null,

            });


        }

        return {
            meta: vendors.getMeta(),
            data: data
        };

    }


    //Create a vendor
    async store({ request }: HttpContext) {

        const payload = request.only([
            'unit_id',
            'group_name',
            'vendor_name',
            'vendor_whatsapp',
            'ticket_from',
            'ticket_to'
        ]);

        payload.vendor_whatsapp = '55' + payload.vendor_whatsapp.replace(/\D/g, '');

        const userPass = await Hash.make('123456');

        const vendor = {
            "name": payload.vendor_name,
            "whatsapp": payload.vendor_whatsapp,
            "password": userPass,
            "role": "vendor",
            "tenant_id": 1
        };


        try {
            const user = await User.create(vendor);

            const groupData = {
                "name": payload.group_name,
                "unit_id": payload.unit_id,
                "manager_id": user.id
            };

            try {

                const group = await Group.create(groupData);

                try {

                    await TicketsService.bulkEdit({
                        event: 1,
                        from: payload.ticket_from,
                        to: payload.ticket_to,
                        vendorId: user.id,
                        groupId: group.id
                    });


                    const unit = await Unit.findBy('id', payload.unit_id);
                    const unitName = unit ? unit.name : 'Nome da comunidade';

                    console.log(unitName)

                    const message = `Olá ${payload.vendor_name}!,

Você foi cadastrado(a) como vendedor(a) das cartelas *${payload.ticket_from} - ${payload.ticket_to}* da pastoral *${payload.group_name}* da Comunidade *${unitName}*.
Segue abaixo as instruções de como enviar os canhotos. Qualquer dúvida é só chamar!`;

                    await WapiService.sendWhatsappText({
                        phone: payload.vendor_whatsapp,
                        message: message,
                    });

                    await WapiService.sendWhatsappImage({
                        phone: payload.vendor_whatsapp,
                        imageUrl: 'https://storage.showdepremios.cloud/file/1766990765105.jpeg'
                    });

                } catch (error) {
                    return {
                        success: false,
                        message: 'O vendedor e a paróquia foram criados, mas houve um erro ao atualizar as cartelas. Contate o suporte.'
                    }

                }

            } catch (error) {
                return {
                    success: false,
                    message: 'O vendedor foi criado, mas houve um erro ao criar a paróquia. Contate o suporte.'
                }
            }

        } catch (error) {

            if (error.code === 'ER_DUP_ENTRY') {
                return {
                    success: false,
                    message: 'Já existe um vendedor com esse número de WhatsApp cadastrado.'
                }
            }

            return {
                success: false,
                message: 'Erro ao criar o vendedor. Contate o suporte.'
            }
        }

        return {
            success: true,
            data: vendor
        };
    }

    async show({ params }: HttpContext) {
        return User.findOrFail(params.id)
    }


    //Excluir vendedor
    async destroy({ params }: HttpContext) {


        try {

            const vendor = await User.findOrFail(params.id);

            await vendor.delete();

            //Remover vinculo do vendedor nas cartelas
            await Ticket.query().where('vendor_id', params.id).update({ vendor_id: null, group_id: null, delivered_on: null });

            //Remover paróquia vinculada ao vendedor
            await Group.query().where('manager_id', params.id).delete();

            return { success: true, message: 'Vendedor excluído com sucesso.' };


        } catch (error) {

            return { success: false, message: 'Erro ao excluir o vendedor. Contate o suporte.', error: error.message };

        }
        
    }

}