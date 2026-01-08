import Tenant from '#models/tenant'
import type { HttpContext } from '@adonisjs/core/http'

export default class TenantsController {
  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    return Tenant.query().paginate(page, limit)
  }

  async store({ request }: HttpContext) {
    const data = request.only(['name'])
    return Tenant.create(data)
  }

  async show({ params }: HttpContext) {
    return Tenant.findOrFail(params.id)
  }

  async update({ params, request }: HttpContext) {
    const tenant = await Tenant.findOrFail(params.id)
    tenant.merge(request.only(['name']))
    await tenant.save()
    return tenant
  }

  async destroy({ params, response }: HttpContext) {
    const tenant = await Tenant.findOrFail(params.id)
    await tenant.delete()
    return response.noContent()
  }
}
