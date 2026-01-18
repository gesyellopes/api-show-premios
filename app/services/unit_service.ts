import Unit from "#models/unit";
import TicketsService from "./tickets_service.js";
import Group from "#models/group";
import UserService from "./user_service.js";

/*
type listUnits = {
    page?: number;
    limit?: number;
    counts?: boolean;
    groups?: boolean;
    manager?: boolean;
}
    */

export default class UnitService {

    // Lista as comunidades
    static async listUnits() {

        const units = await Unit.query().orderBy('id', 'asc')

        for (const unit of units) {
            const counts = await UnitService.getUnitCount(unit.id);
            (unit as any).counts = counts;

            //Quantidade de grupos na unit
            const groupCount = await Group.query().where('unit_id', unit.id).count('* as total').first();
            (unit as any).groupCount = groupCount ? groupCount.$extras.total : 0;

            //Manager da Unit
            if (unit.managerId) {
                const managerData = await UserService.getUserData(unit.managerId, ['id', 'name', 'whatsapp']);
                (unit as any).manager = managerData;
            }
            
        }

        return {
            total: units.length,
            data: units.map((u) => ({ id: u.id, name: u.name, counts: (u as any).counts, groupCount: (u as any).groupCount, manager: (u as any).manager })),
        }

    }

    // Obter unidade
    static async getUnitCount(unit_id: number) {

        //Counts de tickets da unit
        const totalTickets = await TicketsService.countTicketsByKey({ unit_id: unit_id });;
        const returnedTickets = await TicketsService.countTicketsByKey({ unit_id: unit_id }, true);
        const originalTickets = totalTickets + returnedTickets;
        const validatedTickets = await TicketsService.countTicketsByKey({ unit_id: unit_id, validated: 1 });

        return {
            totalTickets: totalTickets,
            validatedTickets: validatedTickets,
            awaitValidationTickets: totalTickets - validatedTickets,
            totalOriginal: originalTickets,
            returnedTickets: returnedTickets
        }

    }

}