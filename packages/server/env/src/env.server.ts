import { z } from "zod"

// Only use on the server
const envSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  RESEND_API_KEY: z.string(),
  VERCEL_ENV: z.enum(["development", "production", "preview"]).optional(),
  VERCEL_GIT_COMMIT_REF: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  SLACK_TOKEN: z.string(),
  // GOOGLE_API_KEY: z.string(),
  QSTASH_TOKEN: z.string(),
  QSTASH_CURRENT_SIGNING_KEY: z.string(),
  QSTASH_NEXT_SIGNING_KEY: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  STRIPE_PRICE_ID: z.string(),
  OPEN_WEATHER_KEY: z.string(),
  NODE_ENV: z.enum(["development", "production"]).optional(),
  APP_SECRET: z.string(),
  DATABASE_URL: z.string(),
  SESSION_SECRET: z.string(),
  FLASH_SESSION_SECRET: z.string(),
  THEME_SESSION_SECRET: z.string(),
})

export const env = envSchema.parse(process.env)

export const IS_PRODUCTION = env.VERCEL_ENV === "production"
export const IS_PREVIEW = env.VERCEL_ENV === "preview"
export const IS_DEV = !env.VERCEL_ENV

export const ENV = env.VERCEL_ENV || "development"
// WEB URL
export const FULL_WEB_URL = IS_DEV
  ? "http://localhost:3000"
  : IS_PREVIEW
    ? `https://${env.VERCEL_GIT_COMMIT_REF === "develop" ? "dev.myelement.app" : env.VERCEL_URL}`
    : `https://myelement.app`
