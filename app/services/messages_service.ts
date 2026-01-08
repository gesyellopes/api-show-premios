// app/services/wapi_service.ts
import env from '#start/env'
import { promises as fs } from 'node:fs'
import path from 'node:path'

type WapiMediaType = 'image' | 'document' | 'audio' | 'video' | 'others'

type SendTextParams = {
    phone: string
    message: string
    messageId?: string
    delayMessage?: number
}

type DownloadMediaParams = {
    mediaKey: string
    directPath: string
    type: WapiMediaType
    mimetype: string
}

type WapiError = Error & { status?: number; data?: any }

export default class WapiService {
    // 🔧 Config centralizada
    private static readonly BASE_URL =
        env.get('WAPI_BASE_URL', 'https://api.w-api.app/v1/message')

    private static readonly TOKEN = env.get('TOKEN_INSTANCE')
    private static readonly INSTANCE_ID = env.get('INSTANCE_ID')

    // 🔧 Onde salvar (ajuste se preferir: tmp/ ou storage/)
    private static readonly STORAGE_ROOT = path.join(process.cwd(), 'storage', 'media')

    private static assertEnv() {
        if (!this.TOKEN) throw new Error('TOKEN_INSTANCE não definido no .env')
        if (!this.INSTANCE_ID) throw new Error('INSTANCE_ID não definido no .env')
    }

    private static folderFromType(type: string) {
        const t = String(type).toLowerCase()
        if (t === 'image') return 'images'
        if (t === 'audio') return 'audio'
        if (t === 'video') return 'video'
        if (t === 'document') return 'documents'
        return 'others'
    }

    private static async requestWapi(
        pathname: string,
        { method = 'GET', body }: { method?: string; body?: any } = {}
    ) {
        this.assertEnv()

        const url = `${this.BASE_URL}${pathname}`

        const res = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${this.TOKEN}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
        })

        const text = await res.text()
        let data: any
        try {
            data = text ? JSON.parse(text) : null
        } catch {
            data = { raw: text }
        }

        if (!res.ok) {
            const err: WapiError = new Error(`WAPI error ${res.status}`)
            err.status = res.status
            err.data = data
            throw err
        }

        return data
    }

    //Enviar imagem
    static async sendWhatsappImage({ phone, imageUrl }: { phone: string; imageUrl: string }) {
        if (!phone) throw new Error('phone é obrigatório')
        if (!imageUrl) throw new Error('imageUrl é obrigatório')

        const body = {
            phone,
            image: imageUrl,
        }

        return this.requestWapi(`/send-image?instanceId=${encodeURIComponent(this.INSTANCE_ID)}`, {
            method: 'POST',
            body,
        })
    }

    // ✅ Enviar texto
    static async sendWhatsappText({ phone, message, messageId, delayMessage = 15 }: SendTextParams) {
        if (!phone) throw new Error('phone é obrigatório')
        if (!message) throw new Error('message é obrigatório')

        const body = {
            phone,
            message,
            delayMessage,
            ...(messageId ? { messageId } : {}),
        }

        return this.requestWapi(`/send-text?instanceId=${encodeURIComponent(this.INSTANCE_ID)}`, {
            method: 'POST',
            body,
        })
    }

    // ✅ Baixar mídia e salvar em storage/media/<tipo>/
    static async downloadMedia({ mediaKey, directPath, type, mimetype }: DownloadMediaParams) {
        this.assertEnv()

        if (!mediaKey) throw new Error('mediaKey é obrigatório')
        if (!directPath) throw new Error('directPath é obrigatório')
        if (!type) throw new Error('type é obrigatório')
        if (!mimetype) throw new Error('mimetype é obrigatório')

        // 1) pede o fileLink
        const url = `${this.BASE_URL}/download-media?instanceId=${encodeURIComponent(this.INSTANCE_ID)}`

        const res = await fetch(url, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.TOKEN}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({ mediaKey, directPath, type, mimetype }),
        })

        if (!res.ok) {
            const errText = await res.text().catch(() => '')
            throw new Error(`Falha ao solicitar fileLink (${res.status}): ${errText}`)
        }

        const json = (await res.json().catch(() => null)) as any

        if (!json || json.error !== false || !json.fileLink) {
            throw new Error(`Resposta inesperada do download-media: ${JSON.stringify(json)}`)
        }

        const fileLink = json.fileLink as string

        // 2) baixa o arquivo pelo fileLink
        const fileRes = await fetch(fileLink, {
            method: 'GET',
            headers: {
                // se não precisar auth, pode remover
                Authorization: `Bearer ${this.TOKEN}`,
                Accept: '*/*',
            },
        })

        if (!fileRes.ok) {
            const errText = await fileRes.text().catch(() => '')
            throw new Error(`Falha ao baixar arquivo (${fileRes.status}): ${errText}`)
        }

        // pasta do tipo
        const folder = this.folderFromType(type)
        const dir = path.join(this.STORAGE_ROOT, folder)
        await fs.mkdir(dir, { recursive: true })

        // nome do arquivo
        const urlObj = new URL(fileLink)
        const originalName = path.basename(urlObj.pathname)
        const fileName = originalName || `${Date.now()}`

        const filePath = path.join(dir, fileName)

        const buffer = Buffer.from(await fileRes.arrayBuffer())
        await fs.writeFile(filePath, buffer)

        return {
            ok: true,
            filePath,
            fileName,
            fileLink,
            expires: json.expires,
        }
    }
}