/*
|--------------------------------------------------------------------------
| Routes — REPORTS
| prefix: /api/v1
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import ReportsController from '#controllers/reports/reports_controller'

router
  .group(() => {
    router.get('report/kpis', [ReportsController, 'kpis'])
    router.get('report/validationReport', [ReportsController, 'validationReport'])
    router.get('report/financialReport', [ReportsController, 'financialReport'])
  })
  .prefix('/api/v1')
