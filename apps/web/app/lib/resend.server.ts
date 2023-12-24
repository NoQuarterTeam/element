import { env } from "@element/server-env"
import { Resend } from "resend"

export const resend = new Resend(env.RESEND_API_KEY)
