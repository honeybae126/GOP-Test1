import { z } from 'zod'

const envSchema = z.preprocess((env: Record<string, unknown>) => ({
  AUTH_SECRET: env.AUTH_SECRET ?? 'gop-automation-demo-secret-do-not-use-in-prod!!',
  AZURE_AD_CLIENT_ID: env.AZURE_AD_CLIENT_ID ?? '',
  AZURE_AD_CLIENT_SECRET: env.AZURE_AD_CLIENT_SECRET ?? '',
  AZURE_AD_TENANT_ID: env.AZURE_AD_TENANT_ID ?? '',
  DATABASE_URL: env.DATABASE_URL,
}), z.object({
  AUTH_SECRET: z.string().min(1),
  AZURE_AD_CLIENT_ID: z.string(),
  AZURE_AD_CLIENT_SECRET: z.string(),
  AZURE_AD_TENANT_ID: z.string(),
  DATABASE_URL: z.string().min(1),
}))

export const env = envSchema.parse(process.env)
