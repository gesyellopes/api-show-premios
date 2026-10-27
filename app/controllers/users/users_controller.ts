import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import Hash from '@adonisjs/core/services/hash'

export default class UsersController {
  async index({ request }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    return User.query()
      .select('id', 'name', 'whatsapp', 'role', 'tenant_id', 'created_at')
      .paginate(page, limit)
  }

  async store({ request }: HttpContext) {
    const data = request.only([
      'name',
      'whatsapp',
      'password',
      'role',
      'tenant_id',
    ])

    data.password = await Hash.make(data.password)

    return User.create(data)
  }

  async show({ params }: HttpContext) {
    return User.findOrFail(params.id)
  }

  async update({ params, request }: HttpContext) {
    const user = await User.findOrFail(params.id)

    const data = request.only(['name', 'whatsapp', 'role', 'tenant_id'])


    /*
    if (request.input('password')) {
      data.password = await Hash.make(request.input('password'))
    }
      */

    user.merge(data)
    await user.save()

    return user
  }

  async destroy({ params, response }: HttpContext) {
    const user = await User.findOrFail(params.id)
    await user.delete()

    return response.noContent()
  }
}
