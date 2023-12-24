import { Resend } from "resend"

import { env } from "@element/server-env"

export const resend = new Resend(env.RESEND_API_KEY)
