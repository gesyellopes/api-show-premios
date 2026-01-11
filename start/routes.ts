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
//import AuthController from '#controllers/auth_controller'
import WhatsappAllowedNumbersController from '#controllers/whatsapp_allowed_numbers_controller'

import VendorsController from '#controllers/vendors_controller';
import ReportsController from '#controllers/reports_controller'

router.group(() => {

  router.resource('tenants', TenantsController).apiOnly()
  router.resource('users', UsersController).apiOnly()
  router.resource('tickets', TicketsController).apiOnly()

  //Unit
  router.get('units/list', [UnitsController, 'unitsList']);
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
  router.post('vendors/:id/update-range', [VendorsController, 'updateRange']);
  //Obter range do vendedor
  router.get('vendors/:id/range', [VendorsController, 'getRange']);

  //Vendor general
  router.resource('vendors', VendorsController).apiOnly()

  //GROUPS
  router.get('groups/by-unit/:id', [GroupsController, 'byUnit']);


  //groups-geral
  router.resource('groups', GroupsController).apiOnly()
  
  //router.post('auth/login', [AuthController, 'login'])

  //router.get('auth/me', [AuthController, 'me']).use('auth:api')

  //router.post('auth/logout', [AuthController, 'logout']).use('auth:api')
  


}).prefix('/api/v1')

router.get('/', async () => {
  return {
    hello: 'world',
  }
})
