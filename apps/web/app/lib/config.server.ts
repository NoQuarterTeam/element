import { z } from "zod"

// Only use on the server
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  APP_ENV: z.enum(["development", "production", "test"]),
  APP_SECRET: z.string(),
  OPEN_WEATHER_KEY: z.string(),
  SESSION_SECRET: z.string(),
  RESEND_API_KEY: z.string(),
  PRICE_ID: z.string(),
  FLASH_SESSION_SECRET: z.string(),
  THEME_SESSION_SECRET: z.string(),
  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string(),
  WEB_URL: z.string(),
  AWS_ACCESS_KEY_USER: z.string(),
  AWS_SECRET_KEY_USER: z.string(),
})

export const {
  NODE_ENV,
  APP_ENV,
  APP_SECRET,
  OPEN_WEATHER_KEY,
  SESSION_SECRET,
  RESEND_API_KEY,
  PRICE_ID,
  FLASH_SESSION_SECRET,
  THEME_SESSION_SECRET,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  WEB_URL,
  AWS_ACCESS_KEY_USER,
  AWS_SECRET_KEY_USER,
} = envSchema.parse(process.env)

export const IS_PRODUCTION = APP_ENV === "production"
// WEB URL
export const FULL_WEB_URL = `${APP_ENV !== "development" ? "https://" : "http://"}${WEB_URL}`
