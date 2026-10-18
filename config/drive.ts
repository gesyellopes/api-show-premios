import env from '#start/env'
import { defineConfig, services } from '@adonisjs/drive'
import type { InferDriveDisks } from '@adonisjs/drive/types' // ✅ Adicione este import

const driveConfig = defineConfig({
  // No seu .env, coloque DRIVE_DISK=garage
  default: env.get('DRIVE_DISK_DEFAULT') as 'public',
  services: {
    /**
     * DISCO PÚBLICO
     * Usado para fotos de perfil, banners, etc.
     */
    public: services.s3({
      credentials: {
        accessKeyId: env.get('S3_KEY'),
        secretAccessKey: env.get('S3_SECRET'),
      },
      region: env.get('S3_REGION'),
      bucket: env.get('S3_BUCKET_PUBLIC'),
      endpoint: env.get('S3_ENDPOINT'),

      /**
       * Crucial para Garage, Minio e LocalStack:
       * Faz com que a URL seja http://endpoint/bucket ao invés de http://bucket.endpoint
       */
      forcePathStyle: true,

      visibility: 'public',
      signingRegion: env.get('S3_REGION'),
    }),
    /**
     * DISCO PRIVADO
     * Usado para contratos e comprovantes
     */
    private: services.s3({
      credentials: {
        accessKeyId: env.get('S3_KEY'),
        secretAccessKey: env.get('S3_SECRET'),
      },
      region: env.get('S3_REGION'),
      bucket: env.get('S3_BUCKET_PRIVATE'),
      // Para o privado, usamos o endpoint principal do S3 do Garage
      endpoint: env.get('S3_ENDPOINT'),
      forcePathStyle: true,
      visibility: 'private', // 👈 Define como privado
      signingRegion: env.get('S3_REGION'),
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
