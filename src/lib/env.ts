import { z } from 'zod'

const envSchema = z.object({
  AUTH_SECRET:            z.string().min(1),
  AZURE_AD_CLIENT_ID:     z.string().min(1),
  AZURE_AD_CLIENT_SECRET: z.string().min(1),
  AZURE_AD_TENANT_ID:     z.string().min(1),
  DATABASE_URL:           z.string().min(1),
})

export const env = envSchema.parse(process.env)
