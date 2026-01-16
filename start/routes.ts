/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
| Organização por DOMÍNIO + TIPO
| Nada funcional foi alterado
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'

/**
 * ============================================================================
 * Controllers
 * ============================================================================
 */
import TenantsController from '#controllers/tenants_controller'
import UsersController from '#controllers/users_controller'
import TicketsController from '#controllers/tickets_controller'
import UnitsController from '#controllers/units_controller'
import GroupsController from '#controllers/groups_controller'
import VendorsController from '#controllers/vendors_controller'
import ReportsController from '#controllers/reports_controller'
import NotificationsController from '#controllers/notifications_controller'
import AuthController from '#controllers/auth_controller'
import WhatsappAllowedNumbersController from '#controllers/whatsapp_allowed_numbers_controller'

/**
 * ============================================================================
 * Middlewares
 * ============================================================================
 */
import { middleware } from '#start/kernel'

/**
 * ============================================================================
 * Infra / Queues
 * ============================================================================
 */
import { testQueue } from './queues/queue_test.js'
import RafflesController from '#controllers/raffles_controller'
import RaffleRoundsController from '#controllers/raffle_rounds_controller'

/**
 * ============================================================================
 * API v1 — PUBLIC + MIXED
 * prefix: /api/v1
 * ============================================================================
 */
router
  .group(() => {
    /**
     * ------------------------------------------------------------------------
     * AUTH (public)
     * ------------------------------------------------------------------------
     */
    router.post('auth/login', [AuthController, 'login'])
    router.post('auth/forgot-password', [AuthController, 'forgotPassword'])
    router.post('auth/reset-password', [AuthController, 'resetPassword'])
    router.post('auth/validate-otp', [AuthController, 'validateOtp'])

    /**
     * ------------------------------------------------------------------------
     * CORE / MASTER DATA
     * ------------------------------------------------------------------------
     */
    router.resource('tenants', TenantsController).apiOnly()
    router.resource('users', UsersController).apiOnly()
    router.resource('whatsapp-allowed-numbers', WhatsappAllowedNumbersController).apiOnly()

    /**
     * ------------------------------------------------------------------------
     * UNITS
     * ------------------------------------------------------------------------
     */
    

    router
      .get('units/list', [UnitsController, 'unitsList'])
      //.use(middleware.auth())
      //.use(middleware.acl({ permission: 'view_units' }))

    router.resource('units', UnitsController).apiOnly()

    /**
     * ------------------------------------------------------------------------
     * GROUPS
     * ------------------------------------------------------------------------
     */
    router.resource('groups', GroupsController).apiOnly()
    router.get('groups/by-unit/:id', [GroupsController, 'byUnit'])

    /**
     * ------------------------------------------------------------------------
     * VENDORS
     * ------------------------------------------------------------------------
     */
    router.resource('vendors', VendorsController).apiOnly()

    router.post('vendors/update-range/:id/', [VendorsController, 'updateRange'])
    router.get('vendors/:id/tickets', [VendorsController, 'tickets'])
    router.get('vendors/:id/range', [VendorsController, 'getRange'])

    /**
     * ------------------------------------------------------------------------
     * TICKETS
     * ------------------------------------------------------------------------
     */
    
    router.get('validate/:ticket_number', [TicketsController, 'checkValidation'])
    router.post('validate', [TicketsController, 'validateByBody'])

    router.post('tickets/return', [TicketsController, 'returnTickets'])
    router.post('tickets/bulk/create', [TicketsController, 'bulkCreate'])
    router.post('tickets/bulk/edit', [TicketsController, 'bulkEdit'])

    router.resource('tickets', TicketsController).apiOnly()

    /**
     * ------------------------------------------------------------------------
     * REPORTS
     * ------------------------------------------------------------------------
     */
    router.get('report/kpis', [ReportsController, 'kpis'])
    router.get('report/validationReport', [ReportsController, 'validationReport'])
    router.get('report/financialReport', [ReportsController, 'financialReport'])

    /**
     * ------------------------------------------------------------------------
     * NOTIFICATIONS
     * ------------------------------------------------------------------------
     */
    router.get(
      'notifications/request-ticket-registration/:id',
      [NotificationsController, 'requestTicketRegistration']
    )

    /**
     * ------------------------------------------------------------------------
     * RAFFLES
     * ------------------------------------------------------------------------
     */
    
    
    
    router.resource('raffle/round', RaffleRoundsController).apiOnly()

    //Call Number
    router.post('raffle/round/call-number/', [RafflesController, 'callNumber'])
    router.post('raffle/round/remove-call-number/', [RafflesController, 'removeCallNumber'])

    //Start round
    router.post('raffle/round/:id/start', [RaffleRoundsController, 'startRound'])
    router.post('raffle/tickets/upload-csv', [TicketsController, 'uploadCsv'])
    router.resource('raffle', RafflesController).apiOnly()


  })
  .prefix('/api/v1')

/**
 * ============================================================================
 * API v1 — AUTHENTICATED ONLY
 * prefix: /api/v1
 * ============================================================================
 */
router
  .group(() => {
    router.get('auth/me', [AuthController, 'me'])
    router.post('auth/logout', [AuthController, 'destroy'])
    router.post('auth/refresh', [AuthController, 'refresh'])
  })
  .prefix('/api/v1')
  .use(middleware.auth())

/**
 * ============================================================================
 * INFRA / DEV ROUTES
 * ============================================================================
 */
router.get('/test-queue', async () => {
  await testQueue.add('test-job', {
    message: 'Fila funcionando 🎯',
    timestamp: new Date().toISOString(),
  })

  return { success: true }
})

/**
 * ============================================================================
 * ROOT
 * ============================================================================
 */
router.get('/', async () => {
  return { hello: 'world' }
})
