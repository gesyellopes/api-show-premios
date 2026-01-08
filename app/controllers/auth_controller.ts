import User from '#models/user'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'

function normalizeWhatsapp(raw: unknown) {
  let w = String(raw ?? '').replace(/\D/g, '')

  // Se vier com DDI 55 e tiver mais de 11 dígitos, mantém (seu banco tem muitos com 55).
  // Se você quiser PADRONIZAR sem 55, descomente abaixo:
  // if (w.startsWith('55') && w.length > 11) w = w.slice(2)

  return w
}


export default class AuthController {
  /**
   * POST /auth/login
   * body: { whatsapp, password }
   */
  public async login({ request, response, auth }: HttpContext) {
    const rawWhatsapp = request.input('whatsapp')
    const password = request.input('password')

    if (!rawWhatsapp || !password) {
      return response.badRequest({
        success: false,
        message: 'whatsapp e password são obrigatórios',
      })
    }

    const whatsapp = normalizeWhatsapp(rawWhatsapp)

    // 🔎 Debug rápido (pode remover depois)
    const found = await User.query().where('whatsapp', whatsapp).first()
    console.log('WHATSAPP NORMALIZADO:', whatsapp)
    console.log('ACHOU USER?', !!found)
    if (found) {
      console.log('VERIFY:', await hash.verify(found.password, password))
    }

    try {
      // ✅ Autenticação "Adonis way" (usa o guard/config e já emite token)
      const token = await auth.use('api').attempt(whatsapp, password)

      return {
        success: true,
        data: {
          token: token.value!.release(),
        },
      }
    } catch {
      return response.unauthorized({
        success: false,
        message: 'Credenciais inválidas',
      })
    }
  }

  /**
   * GET /api/v1/auth/me
   * Requer .use('auth:api') na rota
   */
  public async me({ auth, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized({ success: false, message: 'Não autenticado' })
    }

    const user = auth.user

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        whatsapp: user.whatsapp,
        role: user.role,
        tenant_id: user.tenantId,
      },
    }
  }

  /**
   * GET /auth/me
   */
  async me({ auth, response }: HttpContext) {
    if (!auth.user) {
      return response.unauthorized({ success: false, message: 'Não autenticado' })
    }

    const user = auth.user

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        whatsapp: user.whatsapp,
        role: user.role,
        tenant_id: user.tenantId,
      },
    }
  }

  /**
   * POST /auth/logout
   * revoga token atual
   */
  async logout({ auth }: HttpContext) {
    await auth.use('api').invalidate()
    return { success: true }
  }
}
