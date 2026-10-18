import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'
import { MultipartFile } from '@adonisjs/core/bodyparser'
import fs from 'node:fs'
import axios from 'axios'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'
import os from 'node:os'

@inject()
export default class S3Storage {
  /**
   * Faz o upload de um arquivo para o S3 (Garage)
   * @param file O arquivo vindo da request ou um Stream
   * @param destination O caminho completo + nome do arquivo (ex: 'avatars/user-1.jpg')
   * @param isPrivate Se true, envia para o disco 'private', caso contrário para o 'public'
   */
  async upload(file: MultipartFile, destination: string, isPrivate: boolean = false) {
    try {
      // Seleciona o disco com base na flag
      const disk = isPrivate ? drive.use('private') : drive.use('public')

      // Usa putStream para enviar o arquivo diretamente do disco para o S3
      // sem carregar o conteúdo na memória do servidor
      const stream = fs.createReadStream(file.tmpPath!)
      const contentType = file.headers['content-type'] ?? 'application/octet-stream'

      await disk.putStream(destination, stream, { contentType })

      return true
    } catch (error: any) {
      // Aqui você poderia logar o erro em um Sentry da vida
      throw new Error(`Falha no upload para o S3: ${error.message}`)
    }
  }

  /**
   * Gera a URL para visualização
   */
  async getUrl(filename: string, isPrivate: boolean = false) {
    const disk = isPrivate ? drive.use('private') : drive.use('public')

    if (isPrivate) {
      // Para o privado, sempre gera link temporário (ex: 10 minutos)
      return await disk.getSignedUrl(filename, { expiresIn: '10m' })
    }

    // Para o público, retorna a URL direta (files.showdepremios.cloud/...)
    return await disk.getUrl(filename)
  }

  /**
   * Salva um stream bruto (como um JSON gerado em tempo real)
   */
  async putRawStream(
    destination: string,
    stream: any,
    contentType: string,
    size: number,
    isPrivate: boolean = false
  ) {
    const disk = isPrivate ? drive.use('private') : drive.use('public')

    await disk.putStream(destination, stream, {
      contentType,
      contentLength: size, // Informa o tamanho pro S3
    })
  }

  /**
   * Retorna o conteúdo de um arquivo como string
   * Retorna null se o arquivo não existir
   */
  async getContent(destination: string, isPrivate: boolean = false): Promise<string | null> {
    const disk = isPrivate ? drive.use('private') : drive.use('public')

    try {
      const bytes = await disk.get(destination)
      return Buffer.from(bytes).toString('utf-8')
    } catch (error: any) {
      // E_CANNOT_READ_FILE é lançado quando o arquivo não existe no S3
      if (error.code === 'E_CANNOT_READ_FILE') return null
      throw error // outros erros (rede, permissão, etc) ainda sobem
    }
  }

  /**
   * Deleta um arquivo do disco
   */
  async delete(destination: string, isPrivate: boolean = false): Promise<void> {
    const disk = isPrivate ? drive.use('private') : drive.use('public')

    await disk.delete(destination)
  }

  async uploadFromUrl(
    url: string,
    options: { path?: string; fileName?: string; isPrivate?: boolean } = {}
  ) {
    const tmpPath = path.join(os.tmpdir(), `upload-${Date.now()}.tmp`)

    try {
      const response = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        timeout: 15000,
      })

      // Salva temporariamente
      await pipeline(response.data, fs.createWriteStream(tmpPath))

      const originalName = path.basename(new URL(url).pathname)
      const extension = path.extname(originalName)
      const finalFileName = options.fileName ? `${options.fileName}${extension}` : originalName

      const destination = options.path
        ? path.join(options.path, finalFileName).replace(/\\/g, '/')
        : finalFileName

      const disk = options.isPrivate ? drive.use('private') : drive.use('public')
      const fileStream = fs.createReadStream(tmpPath)

      // Resolvendo o erro de tipagem do Axios
      const contentType = String(response.headers['content-type'] || 'application/octet-stream')

      await disk.putStream(destination, fileStream, { contentType })

      return {
        success: true,
        destination,
        url: await this.getUrl(destination, options.isPrivate),
        storageFileName: finalFileName,
      }
    } catch (error: any) {
      throw new Error(`Falha no uploadFromUrl: ${error.message}`)
    } finally {
      // Limpeza garantida do disco local
      if (fs.existsSync(tmpPath)) {
        await fs.promises.unlink(tmpPath).catch(() => {})
      }
    }
  }
}
