import type { HttpContext } from '@adonisjs/core/http'
import { access } from '#abilities/main'

/**
 * Uso:
 * .use(middleware.acl({ permission: 'view_units' }))
 */
export default class AclMiddleware {
  async handle(
    ctx: HttpContext,
    next: () => Promise<void>,
    options: { permission: string }
  ) {
    // garante que o middleware foi chamado com permission
    if (!options?.permission) {
      return ctx.response.internalServerError({
        message: 'ACL middleware: permission não informada',
      })
    }

    // exige auth antes (se ctx.auth.user não existir, vai negar)
    const user = ctx.auth.user
    if (!user) {
      return ctx.response.unauthorized({ message: 'Não autenticado' })
    }

    // checa permissão
    if (await ctx.bouncer.denies(access, options.permission)) {
      return ctx.response.forbidden({ message: 'Sem permissão' })
    }

    await next()
  }
}
