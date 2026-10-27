import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import { randomUUID } from 'node:crypto'
import S3Storage from '#modules/storage/services/s3_service'

@inject()
export default class UploadsController {
  constructor(protected s3Storage: S3Storage) {}

  /**
   * Upload de uma ou mais imagens (campo `files`, multipart/form-data)
   * Nomeação igual ao worker: <pasta>/<id><extensão>
   */
  public async store({ request, response }: HttpContext) {
    const files = request.files('files', {
      extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      size: '5mb',
    })

    if (files.length === 0) {
      return response.badRequest({ success: false, message: 'At least one image file is required' })
    }

    const data = await Promise.all(
      files.map(async (file) => {
        const fileName = `${randomUUID()}.${file.extname}`
        const destination = `tickets/${fileName}`

        await this.s3Storage.upload(file, destination)

        return { fileName, url: await this.s3Storage.getUrl(destination) }
      })
    )

    return response.ok({ success: true, data })
  }
}
