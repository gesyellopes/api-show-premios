import Unit from '#models/unit'
import type { HttpContext } from '@adonisjs/core/http'

export default class UnitsController {
  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const organizationId = request.input('organization_id')
    const managerId = request.input('manager_id')
    const q = request.input('q')

    const query = Unit.query()

    if (organizationId) query.where('organization_id', organizationId)
    if (managerId) query.where('manager_id', managerId)
    if (q) query.where('name', 'like', `%${q}%`)

    return query.orderBy('id', 'desc').paginate(page, limit)
  }

  async store({ request }: HttpContext) {
    const payload = request.only([
      'name',
      'organization_id',
      'manager_id',
    ])

    return Unit.create({
      name: payload.name,
      organizationId: payload.organization_id,
      managerId: payload.manager_id ?? null,
    })
  }

  async show({ params }: HttpContext) {
    return Unit.findOrFail(params.id)
  }

  async update({ params, request }: HttpContext) {
    const unit = await Unit.findOrFail(params.id)

    const payload = request.only([
      'name',
      'organization_id',
      'manager_id',
    ])

    unit.merge({
      name: payload.name ?? unit.name,
      organizationId: payload.organization_id ?? unit.organizationId,
      managerId: payload.manager_id ?? unit.managerId,
    })

    await unit.save()
    return unit
  }

  async destroy({ params, response }: HttpContext) {
    const unit = await Unit.findOrFail(params.id)
    await unit.delete()

    return response.noContent()
  }

  async unitsList() {

    const units = await Unit.query().orderBy('id', 'asc')

    return {
      total: units.length,
      data: units.map((u) => ({ id: u.id, name: u.name })),
    }

  }
}
