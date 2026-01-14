/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

import TenantsController from '#controllers/tenants_controller'
import UsersController from '#controllers/users_controller'
import TicketsController from '#controllers/tickets_controller'
import UnitsController from '#controllers/units_controller'
import GroupsController from '#controllers/groups_controller'
import AuthController from '#controllers/auth_controller'
import WhatsappAllowedNumbersController from '#controllers/whatsapp_allowed_numbers_controller'

import VendorsController from '#controllers/vendors_controller';
import ReportsController from '#controllers/reports_controller'

import NotificationsController from '#controllers/notifications_controller'

import { middleware } from '#start/kernel'

import { testQueue } from './queues/queue_test.js'



router.group(() => {

  router.resource('tenants', TenantsController).apiOnly()
  router.resource('users', UsersController).apiOnly()
  router.resource('tickets', TicketsController).apiOnly()

  //Visualizar Unidades
  router
  .get('units/list', [UnitsController, 'unitsList'])
  .use(middleware.auth())
  .use(middleware.acl({ permission: 'view_units' }))

  router.resource('units', UnitsController).apiOnly()
  router.resource('whatsapp-allowed-numbers', WhatsappAllowedNumbersController).apiOnly()

  router.get('validate/:ticket_number', [TicketsController, 'checkValidation'])
  router.post('validate', [TicketsController, 'validateByBody'])

  router.post('tickets/bulk/create', [TicketsController, 'bulkCreate'])
  router.post('tickets/bulk/edit', [TicketsController, 'bulkEdit'])

  //Data Report
  router.get('report/kpis', [ReportsController, 'kpis']);
  router.get('report/validationReport', [ReportsController, 'validationReport']);
  router.get('report/financialReport', [ReportsController, 'financialReport']);

  //Update Vendors ranges
  router.post('vendors/update-range/:id/', [VendorsController, 'updateRange']);


  //Tickets desse vendor
  router.get('vendors/:id/tickets', [VendorsController, 'tickets']);

  //Obter range do vendedor
  router.get('vendors/:id/range', [VendorsController, 'getRange']);

  //Vendor general
  router.resource('vendors', VendorsController).apiOnly()

  //GROUPS
  router.get('groups/by-unit/:id', [GroupsController, 'byUnit']);


  //groups-geral
  router.resource('groups', GroupsController).apiOnly()

  //Auth 
  router.post('auth/login', [AuthController, 'login'])
  router.post('auth/forgot-password', [AuthController, 'forgotPassword'])
  router.post('auth/reset-password', [AuthController, 'resetPassword'])
  router.post('auth/validate-otp', [AuthController, 'validateOtp'])

  //Notifications
  router.get('notifications/request-ticket-registration/:id', [NotificationsController, 'requestTicketRegistration']);



}).prefix('/api/v1')

//Routes que precisam de autenticação
router.group(() => {

  router.get('auth/me', [AuthController, 'me']);
  router.post('auth/logout', [AuthController, 'destroy']);
  router.post('auth/refresh', [AuthController, 'refresh']);

}).prefix('/api/v1').use(middleware.auth());


router.get('/test-queue', async () => {

  await testQueue.add('test-job', {
    message: 'Fila funcionando 🎯',
    timestamp: new Date().toISOString(),
  })

  return { success: true }
})



//Test route
//router.get('')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})
