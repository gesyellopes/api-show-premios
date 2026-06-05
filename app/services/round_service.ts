//import Ticket from "#models/ticket";
//import RaffleRoundTicket from "#models/raffle_round_ticket";
import RaffleRound from "#models/raffle_round";
import db from '@adonisjs/lucid/services/db';
import { DateTime } from "luxon";

type StartParams = {
    roundId: number
}

type callNumberParamsSchema = {
    raffleId: Number,
    roundId: Number,
    numberToCall: Number,
    drawOrder: Number,
}


type removeCallNumberParamsSchema = {
    raffleId: Number,
    roundId: Number,
    numberToCall: Number
}


type checkTicketHitsParams = {
    called_number: number,
    raffle_id: number,
    round_id: number
}


export default class RoundService {

    //Função para exportar os tickets de um round em um csv num padrão específico
    static async exportRoundTicketsToCSV(roundId: number) {

        //Busco na tabela raffle_round_tickets todos os tickets daquele round
        //Ele tem uma coluna ticket_number que é o número da cartela
        //O csv terá duas colunas ticket_number,unligible
        //Em ticket number ele irá trazer todos os registros que estão na tabela tickets, e os que não estão em raffle_round_tickets ele irá marcar como unligible = X
        //Gero o CSV e entrego ele pronto para download

        const round = await RaffleRound.find(roundId);
        if (!round) {
            return { success: false, message: 'Round not found' }
        }

        //const raffleId = round.raffleId;
        //Busco todos os tickets do raffle
        const allTicketsResult: any = await db.connection('secondary').rawQuery(`
            SELECT ticket_number
            FROM tickets_buritizeiro
            ORDER BY ticket_number ASC
        `);

        const allTickets = allTicketsResult[0] || [];

        //Busco os tickets do round
        const roundTicketsResult: any = await db.rawQuery(`
            SELECT ticket_number
            FROM raffle_round_tickets
            WHERE round_id = ?
        `, [roundId]);

        const roundTicketsSet = new Set(roundTicketsResult[0]?.map((row: any) => row.ticket_number) || []);

        //Monta o CSV
        let csvContent = 'ticket_number,unligible\n';

        for (const ticket of allTickets) {
            const ticketNumber = ticket.ticket_number;
            const unligible = roundTicketsSet.has(ticketNumber) ? '' : 'X';
            csvContent += `${ticketNumber},${unligible}\n`;
        }

        return { success: true, data: csvContent };
    }

    //Encerrar Round
    static async closeRound(params: { roundId: number }) {
        const { roundId } = params;
        
        const round = await RaffleRound.find(roundId);
        if (!round) {
            return { success: false, message: 'Round not found' };
        }

        round.status = 'closed';
        round.decidedAt = DateTime.now();
        await round.save();

        return { success: true, message: 'Round closed successfully' };
    }

    static async startRound(params: StartParams) {

        const { roundId } = params;

        //Busco aqui as informações do round
        const round = await RaffleRound.find(roundId);

        if (!round) {
            return { success: false, message: 'Round not found' }
        }

        //Usa INSERT direto via SQL (muito mais rápido que o ORM)
        //Seleciona apenas os IDs necessários e faz o insert em uma única query
        const result = await db.connection('secondary').rawQuery(`
            INSERT INTO raffle_round_tickets (raffle_id, round_id, ticket_id, ticket_number, eligible, ineligible_reason, created_at, updated_at)
            SELECT ?, ?, id, ticket_number, 1, NULL, NOW(), NOW()
            FROM tickets_buritizeiro
            WHERE validated = 1
        `, [round.raffleId, roundId]);

        const ticketsCount = result[0]?.affectedRows || 0;

        const jsDate: Date = new Date();

        //Atualizo o status do round para 'running' e salvo a contagem de tickets
        round.status = 'running';
        round.ticketsCount = ticketsCount;
        round.startAt = DateTime.fromJSDate(jsDate);
        await round.save();

        return {
            success: true,
            data: {
                roundId,
                raffleId: round.raffleId,
                ticketsCount,
            }
        }

    }

    //Função para chamar número em um round
    static async callNumber(params: callNumberParamsSchema) {

        const { raffleId, roundId, numberToCall } = params;

        //Verifico se o número já foi chamado neste round
        const alreadyCalledResult: any = await db.rawQuery(`
            SELECT COUNT(*) AS count
            FROM raffle_round_called_numbers
            WHERE round_id = ? AND number = ?
        `, [roundId, numberToCall]);
        
        const alreadyCalled = alreadyCalledResult[0][0]?.count > 0;
        
        if (alreadyCalled) {
            return {
                success: false,
                message: `O número ${numberToCall} já foi chamado neste round`,
            };
        }

        //Busco o próximo draw_order disponível para este round
        const maxOrderResult: any = await db.rawQuery(`
            SELECT COALESCE(MAX(draw_order), 0) AS max_order
            FROM raffle_round_called_numbers
            WHERE round_id = ?
        `, [roundId]);
        
        const nextDrawOrder = (maxOrderResult[0][0]?.max_order || 0) + 1;

        //Salvar o número chamado no banco de dados na tabela raffle_round_called_numbers
        await db.table('raffle_round_called_numbers').insert({
            tenant_id: 1, //TODO: ajustar tenant_id futuramente
            raffle_id: raffleId,
            round_id: roundId,
            number: numberToCall,
            draw_order: nextDrawOrder,
            drawn_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
        });

        //Chamo o checkTicketHits para conferir os tickets
        const ticketHitsResult = await this.checkTicketHits({
            called_number: Number(numberToCall),
            raffle_id: Number(raffleId),
            round_id: Number(roundId),
        });

        return {
            success: true,
            data: {
                raffleId,
                roundId,
                calledNumber: numberToCall,
                drawOrder: nextDrawOrder,
                ticketHits: ticketHitsResult.data,
            }
        }

    }


    //Serviço que faz a conferência das cartelas (raffle_round_ticket_hits)
    static async checkTicketHits(params: checkTicketHitsParams) {
        const { called_number, raffle_id, round_id } = params;

        // OTIMIZAÇÃO: Busca todos os tickets que acertaram o número em UMA ÚNICA QUERY com JOIN
        const hitTicketsResult: any = await db.rawQuery(`
            SELECT DISTINCT rrt.ticket_id, rrt.ticket_number
            FROM raffle_round_tickets rrt
            INNER JOIN ticket_numbers tn ON tn.ticket_id = rrt.ticket_id
            WHERE rrt.raffle_id = ? 
              AND rrt.round_id = ? 
              AND rrt.eligible = 1
              AND tn.value = ?
        `, [raffle_id, round_id, called_number]);
        
        const hitTickets = hitTicketsResult[0] || [];

        if (hitTickets.length === 0) {
            return {
                success: true,
                data: {
                    raffleId: raffle_id,
                    roundId: round_id,
                    calledNumber: called_number,
                    hitsProcessed: 0
                }
            };
        }

        // OTIMIZAÇÃO: Usa INSERT ... ON DUPLICATE KEY UPDATE para fazer upsert em uma query
        // Prepara os valores para inserção em lote
        const placeholders = hitTickets.map(() => '(?, ?, ?, ?, ?, 1, ?, NOW(), 0, NULL, NOW(), NOW())').join(',');
        const bindings: any[] = [];
        
        hitTickets.forEach((ticket: any) => {
            bindings.push(1, raffle_id, round_id, ticket.ticket_id, ticket.ticket_number, called_number);
        });

        // UPSERT: Insere novos hits ou atualiza existentes em uma única query
        await db.rawQuery(`
            INSERT INTO raffle_round_ticket_hits 
                (tenant_id, raffle_id, round_id, ticket_id, ticket_number, hits_count, last_called_number, last_hit_at, is_winner, won_at, created_at, updated_at)
            VALUES ${placeholders}
            ON DUPLICATE KEY UPDATE
                hits_count = hits_count + 1,
                last_called_number = VALUES(last_called_number),
                last_hit_at = NOW(),
                is_winner = CASE WHEN hits_count + 1 >= 20 THEN 1 ELSE 0 END,
                won_at = CASE WHEN hits_count + 1 >= 20 THEN NOW() ELSE won_at END,
                updated_at = NOW()
        `, bindings);

        // OTIMIZAÇÃO: Busca apenas o count por hits_count (sem GROUP_CONCAT que é lento)
        const hitsDistributionResult: any = await db.rawQuery(`
            SELECT 
                hits_count,
                COUNT(*) as tickets_count
            FROM raffle_round_ticket_hits
            WHERE round_id = ? AND raffle_id = ?
            GROUP BY hits_count
            ORDER BY hits_count ASC
        `, [round_id, raffle_id]);

        const hitsDistribution = hitsDistributionResult[0] || [];
        
        // Query específica para hits = 0 (tickets elegíveis sem nenhum hit ainda)
        const zeroHitsResult: any = await db.rawQuery(`
            SELECT COUNT(*) as tickets_count
            FROM raffle_round_tickets rrt
            LEFT JOIN raffle_round_ticket_hits rrth 
                ON rrth.ticket_id = rrt.ticket_id 
                AND rrth.round_id = rrt.round_id
            WHERE rrt.round_id = ? 
              AND rrt.raffle_id = ?
              AND rrt.eligible = 1
              AND rrth.id IS NULL
        `, [round_id, raffle_id]);
        
        const zeroHitsCount = zeroHitsResult[0][0]?.tickets_count || 0;
        
        // Verifica se há algum winner (hits >= 20)
        const hasWinner = hitsDistribution.some((item: any) => item.hits_count >= 20);

        // OTIMIZAÇÃO: Busca ticket_numbers apenas para os grupos com hits (limitado e em paralelo)
        const hitsBreakdown = await Promise.all(
            Array.from({ length: 20 }, async (_, index) => {
                const hits = index + 1;
                const found = hitsDistribution.find((item: any) => item.hits_count === hits);
                
                // Se não tem tickets com esse número de hits, retorna vazio
                if (!found) {
                    return {
                        hits,
                        count: 0,
                        ticketNumbers: []
                    };
                }

                // Busca os ticket_numbers
                const ticketsResult: any = await db.rawQuery(`
                    SELECT ticket_number
                    FROM raffle_round_ticket_hits
                    WHERE round_id = ? AND raffle_id = ? AND hits_count = ?
                    ORDER BY ticket_number
                `, [round_id, raffle_id, hits]);
                
                const ticketNumbers = ticketsResult[0].map((row: any) => row.ticket_number);
                
                return {
                    hits,
                    count: found.tickets_count,
                    ticketNumbers
                };
            })
        );

        // Busca ticket_numbers para hits = 0
        let zeroHitsTicketNumbers: string[] = [];
        if (zeroHitsCount > 0) {
            const zeroTicketsResult: any = await db.rawQuery(`
                SELECT rrt.ticket_number
                FROM raffle_round_tickets rrt
                LEFT JOIN raffle_round_ticket_hits rrth 
                    ON rrth.ticket_id = rrt.ticket_id 
                    AND rrth.round_id = rrt.round_id
                WHERE rrt.round_id = ? 
                  AND rrt.raffle_id = ?
                  AND rrt.eligible = 1
                  AND rrth.id IS NULL
                ORDER BY rrt.ticket_number
            `, [round_id, raffle_id]);
            
            zeroHitsTicketNumbers = zeroTicketsResult[0].map((row: any) => row.ticket_number);
        }

        // Adiciona hits = 0 no início do array
        hitsBreakdown.unshift({
            hits: 0,
            count: zeroHitsCount,
            ticketNumbers: zeroHitsTicketNumbers
        });

        return {
            success: true,
            data: {
                raffleId: raffle_id,
                roundId: round_id,
                calledNumber: called_number,
                hitsProcessed: hitTickets.length,
                isWinner: hasWinner,
                hitsBreakdown
            }
        };
    }



    //Essa função quero usar para remover um número chamado e fazer o reverso que a callNumber faz
    static async removeCalledNumber(params: removeCallNumberParamsSchema) {

        const { raffleId, roundId, numberToCall } = params;
        
        //Verifico se o número foi chamado neste round
        const calledResult: any = await db.rawQuery(`
            SELECT id, draw_order
            FROM raffle_round_called_numbers
            WHERE round_id = ? AND number = ?
        `, [roundId, numberToCall]);
        
        if (!calledResult[0] || calledResult[0].length === 0) {
            return {
                success: false,
                message: `O número ${numberToCall} não foi chamado neste round`,
            };
        }

        const removedDrawOrder = calledResult[0][0].draw_order;

        //Busco o último número chamado ANTES do que está sendo removido
        const previousNumberResult: any = await db.rawQuery(`
            SELECT number
            FROM raffle_round_called_numbers
            WHERE round_id = ? AND draw_order < ?
            ORDER BY draw_order DESC
            LIMIT 1
        `, [roundId, removedDrawOrder]);
        
        const previousNumber = previousNumberResult[0]?.[0]?.number || null;

        //OTIMIZAÇÃO: Reverte os hits em uma única query
        //Decrementa hits_count e atualiza last_called_number para o número anterior
        await db.rawQuery(`
            UPDATE raffle_round_ticket_hits
            SET 
                hits_count = GREATEST(hits_count - 1, 0),
                last_called_number = ?,
                last_hit_at = CASE 
                    WHEN hits_count - 1 > 0 THEN last_hit_at
                    ELSE NULL
                END,
                updated_at = NOW()
            WHERE round_id = ? 
              AND last_called_number = ?
        `, [previousNumber, roundId, numberToCall]);

        //Remove registros com hits_count = 0 (limpeza)
        await db.rawQuery(`
            DELETE FROM raffle_round_ticket_hits
            WHERE round_id = ? AND hits_count = 0
        `, [roundId]);

        //Removo o número chamado do banco de dados
        await db.rawQuery(`
            DELETE FROM raffle_round_called_numbers
            WHERE round_id = ? AND number = ?
        `, [roundId, numberToCall]);

        return {
            success: true,
            data: {
                raffleId,
                roundId,
                removedNumber: numberToCall,
                previousNumber: previousNumber,
            }
        }; 

    }

}