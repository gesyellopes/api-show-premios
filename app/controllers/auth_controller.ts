import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Otp from '#models/otp';
import hash from '@adonisjs/core/services/hash';
import { DateTime } from 'luxon';
import NotificationService from '#services/notifications_service';

function normalizeWhatsapp(input: string) {
    let normalized = (input || '').replace(/\D/g, '') // só dígitos
    // Adiciona o código do país (55) se não tiver
    if (!normalized.startsWith('55')) {
        normalized = '55' + normalized
    }
    return normalized
}

function generateOtpCode() {
    // 6 dígitos
    return String(Math.floor(100000 + Math.random() * 900000))
}

export default class AuthController {

    async login({ request, auth, response }: HttpContext) {
        try {
            const { whatsapp, password } = request.only(['whatsapp', 'password'])
            const normalizedWhatsapp = normalizeWhatsapp(whatsapp)

            // Find user by whatsapp
            const user = await User.findBy('whatsapp', normalizedWhatsapp)
            if (!user) {
                // Debug: log the normalized whatsapp for troubleshooting
                console.log(`User not found for whatsapp: ${normalizedWhatsapp}`)
                return response.status(400).send({
                    errors: [{ message: "Invalid user credentials" }]
                })
            }

            // Verify password
            if (!user.password) {
                console.log(`User has no password set: ${normalizedWhatsapp}`)
                return response.status(400).send({
                    errors: [{ message: "Invalid user credentials" }]
                })
            }
            const passwordMatch = await hash.verify(user.password, password)
            if (!passwordMatch) {
                console.log(`Password mismatch for user: ${normalizedWhatsapp}`)
                return response.status(400).send({
                    errors: [{ message: "Invalid user credentials" }]
                })
            }

            const accessToken = await auth.use('api').createToken(user, ['*'], {
                expiresIn: '15m'
            })

            const refreshToken = await auth.use('api').createToken(user, ["refresh"], {
                expiresIn: '30d'
            })

            return {
                user,
                accessToken,
                refreshToken,
            }
        } catch (err: any) {
            console.error('Login error:', err)
            return response.status(500).send({
                errors: [{
                    message: "Internal server error"
                }]
            })
        }
    }

    async destroy({ auth }: HttpContext) {
        await auth.use('api').invalidateToken();
        return { message: 'Logged out successfully' }
    }

    async me({ auth }: HttpContext) {
        const user = auth.use('api').user
        return user
    }

    async refresh({ auth }: HttpContext) {
        const user = auth.use('api').user!

        // invalida o refresh token atual
        await auth.use('api').invalidateToken()

        const newAccessToken = await auth.use('api').createToken(user, ["*"], {
            expiresIn: '15m'
        })

        return {
            accessToken: newAccessToken,
        }
    }

    /**
   * POST /auth/forgot-password
   * Body: { whatsapp: string }
   * Sempre retorna ok.
   */
    async forgotPassword({ request, response }: HttpContext) {
        const whatsapp = normalizeWhatsapp(request.input('whatsapp'))

        // resposta sempre igual (anti-enumeração)
        const generic = { success: true, message: 'Se o número existir, você receberá um código para redefinir a senha.' }

        if (!whatsapp) return response.ok(generic)

        // procura user (se não existir, só devolve generic)
        const user = await User.findBy('whatsapp', whatsapp)

        // gera OTP
        const code = generateOtpCode()
        const codeHash = await hash.make(code)

        const expiresAt = DateTime.now().plus({ minutes: 30 })

        // (opcional) invalidar OTPs anteriores ainda válidos desse whatsapp/purpose
        const now = DateTime.now()
        const nowStr = now.toSQL()
        await Otp.query()
            .where('whatsapp', whatsapp)
            .where('purpose', 'password_reset')
            .whereNull('consumedAt')
            .where('expiresAt', '>', nowStr as any)
            .update({ consumedAt: now })

        // cria registro OTP (userId pode ser null)
        await Otp.create({
            userId: user?.id ?? null,
            whatsapp,
            codeHash,
            expiresAt,
            purpose: 'password_reset',
            attempts: 0,
            maxAttempts: 5,
        })

        // TODO: enviar o código por WhatsApp/SMS
        // Ex: await WapiService.sendMessage(whatsapp, `Seu código é: ${code}`)
        // Importante: logar o código só em DEV

        await NotificationService.sendOtpResetPassword({
            whatsapp,
            code: code,
            purpose: 'password_reset',
        });
        /*
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[DEV OTP] whatsapp=${whatsapp} code=${code}`)
        }

        
        */

        return response.ok(generic)
    }

    /**
     * POST /auth/reset-password
     * Body: { whatsapp: string, code: string, newPassword: string }
     */
    async resetPassword({ request, response }: HttpContext) {
        const whatsapp = normalizeWhatsapp(request.input('whatsapp'))
        const code = String(request.input('code') || '').trim()
        const newPassword = String(request.input('newPassword') || '')

        if (!whatsapp || !code || !newPassword) {
            return response.badRequest({ success: false, message: 'Dados inválidos.' })
        }

        // busca OTP mais recente ainda não consumido e não expirado
        const now = DateTime.now()
        const otp = await Otp.query()
            .where('whatsapp', whatsapp)
            .where('purpose', 'password_reset')
            .whereNull('consumedAt')
            .where('expiresAt', '>', now.toSQL() as any)
            .orderBy('id', 'desc')
            .first()

        if (!otp) {
            return response.unauthorized({ success: false, message: 'Código inválido ou expirado.' })
        }

        // bloqueia por tentativas
        if (otp.attempts >= otp.maxAttempts) {
            // consome para impedir brute-force em cima desse mesmo registro
            otp.consumedAt = DateTime.now()
            await otp.save()
            return response.unauthorized({ success: false, message: 'Código inválido ou expirado.' })
        }

        // valida OTP (comparando hash)
        const ok = await hash.verify(otp.codeHash, code)
        if (!ok) {
            otp.attempts++
            await otp.save()
            return response.unauthorized({ success: false, message: 'Código inválido ou expirado.' })
        }

        // achou o user
        const user = await User.findBy('whatsapp', whatsapp)
        if (!user) {
            // mantém mensagem genérica, mas consome OTP
            otp.consumedAt = DateTime.now()
            await otp.save()
            return response.unauthorized({ success: false, message: 'Código inválido ou expirado.' })
        }

        // ✅ IMPORTANTE: salvar senha em PLAIN TEXT
        // O withAuthFinder vai hashear via hook.
        user.password = newPassword
        await user.save()

        // consome OTP
        otp.consumedAt = DateTime.now()
        await otp.save()

        return response.ok({ success: true, message: 'Senha alterada com sucesso.' })
    }

    /**
 * POST /auth/validate-otp
 * Body: { whatsapp: string, code: string }
 * Apenas valida o OTP (UX step).
 */
    async validateOtp({ request, response }: HttpContext) {
        const whatsapp = normalizeWhatsapp(request.input('whatsapp'))
        const code = String(request.input('code') || '').trim()

        if (!whatsapp || !code) {
            return response.badRequest({ success: false, message: 'Dados inválidos.' })
        }

        const now = DateTime.now()
        const otp = await Otp.query()
            .where('whatsapp', whatsapp)
            .where('purpose', 'password_reset')
            .whereNull('consumedAt')
            .where('expiresAt', '>', now.toSQL() as any)
            .orderBy('id', 'desc')
            .first()

        if (!otp) {
            return response.unauthorized({ success: false, message: 'Código inválido ou expirado.' })
        }

        if (otp.attempts >= otp.maxAttempts) {
            otp.consumedAt = DateTime.now()
            await otp.save()
            return response.unauthorized({ success: false, message: 'Código inválido ou expirado.' })
        }

        const valid = await hash.verify(otp.codeHash, code)
        if (!valid) {
            otp.attempts++
            await otp.save()
            return response.unauthorized({ success: false, message: 'Código inválido ou expirado.' })
        }

        // ⚠️ NÃO consome o OTP aqui
        return response.ok({
            success: true,
            message: 'Código validado com sucesso.',
        })
    }

}