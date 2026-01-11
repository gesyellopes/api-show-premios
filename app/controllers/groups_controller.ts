import Group from '#models/group'
import type { HttpContext } from '@adonisjs/core/http'

export default class GroupsController {
  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)

    const unitId = request.input('unit_id')
    const managerId = request.input('manager_id')
    const q = request.input('q')

    const query = Group.query()

    if (unitId) query.where('unit_id', unitId)
    if (managerId) query.where('manager_id', managerId)
    if (q) query.where('name', 'like', `%${q}%`)

    return query.orderBy('id', 'desc').paginate(page, limit)
  }

  async store({ request, response }: HttpContext) {
    const payload = request.only(['name', 'unit_id', 'manager_id'])

    if (!payload.name || !payload.unit_id) {
      return response.badRequest({
        success: false,
        message: 'name e unit_id são obrigatórios',
      })
    }

    const group = await Group.create({
      name: payload.name,
      unitId: payload.unit_id,
      managerId: payload.manager_id ?? null,
    })

    return { success: true, data: group }
  }

  async show({ params }: HttpContext) {
    return Group.findOrFail(params.id)
  }

  async update({ params, request }: HttpContext) {
    const group = await Group.findOrFail(params.id)

    const payload = request.only(['name', 'unit_id', 'manager_id'])

    group.merge({
      name: payload.name ?? group.name,
      unitId: payload.unit_id ?? group.unitId,
      managerId: payload.manager_id ?? group.managerId,
    })

    await group.save()
    return { success: true, data: group }
  }

  async destroy({ params, response }: HttpContext) {
    const group = await Group.findOrFail(params.id)
    await group.delete()
    return response.noContent()
  }

  async byUnit({ params }: HttpContext) {
    return Group.query().select('id', 'name').where('unit_id', params.id).orderBy('id', 'desc')
  }

}
