/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring secondary database connection
  |----------------------------------------------------------
  */
  DB_SECONDARY_HOST: Env.schema.string({ format: 'host' }),
  DB_SECONDARY_PORT: Env.schema.number(),
  DB_SECONDARY_USER: Env.schema.string(),
  DB_SECONDARY_PASSWORD: Env.schema.string.optional(),
  DB_SECONDARY_DATABASE: Env.schema.string(),

  WAPI_BASE_URL: Env.schema.string.optional(),
  TOKEN_INSTANCE: Env.schema.string(),
  INSTANCE_ID: Env.schema.string(),

  DEFAULT_EVENT_ID: Env.schema.number(),

  //Tabela dos tickets usados nas consultas e sorteios
  TICKETS_AUXILIAR_TABLE: Env.schema.string(),

  //Imagem para cadastro do vendedor
  VENDOR_HELP_GUID_IMAGE: Env.schema.string(),

  //REDIS
  // REDIS_URL: Env.schema.string()

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package (S3 / Garage)
  |----------------------------------------------------------
  */
  DRIVE_DISK_DEFAULT: Env.schema.string(),
  S3_KEY: Env.schema.string(),
  S3_SECRET: Env.schema.string(),
  S3_REGION: Env.schema.string(),
  S3_BUCKET_PUBLIC: Env.schema.string(),
  S3_BUCKET_PRIVATE: Env.schema.string(),
  S3_ENDPOINT: Env.schema.string(),
  S3_PUBLIC_ENDPOINT: Env.schema.string(),
})
