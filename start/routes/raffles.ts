/*
|--------------------------------------------------------------------------
| Routes — RAFFLES
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import RafflesController from '#controllers/raffles/raffles_controller'
import RaffleRoundsController from '#controllers/raffles/raffle_rounds_controller'
import TicketsController from '#controllers/tickets/tickets_controller'

router
  .group(() => {
    //All Raffle Round routes
    router.get('raffle/:id/rounds', [RaffleRoundsController, 'roundsByRaffleId'])

    router.resource('raffle/round', RaffleRoundsController).apiOnly()

    //Call Number
    router.post('raffle/round/call-number/', [RafflesController, 'callNumber'])
    router.post('raffle/round/remove-call-number/', [RafflesController, 'removeCallNumber'])

    //Start round
    router.post('raffle/round/:id/start', [RaffleRoundsController, 'startRound'])

    //End round
    router.post('raffle/round/:id/end', [RaffleRoundsController, 'closeRound'])

    //Export CSV of round tickets
    router.get('raffle/round/:id/export', [RaffleRoundsController, 'exportCsv'])

    router.post('raffle/tickets/upload-csv', [TicketsController, 'uploadCsv'])
    router.resource('raffle', RafflesController).apiOnly()
  })
  .prefix('/api/v1')
