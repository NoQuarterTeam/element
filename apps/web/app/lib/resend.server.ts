import { Resend } from "resend"

import { RESEND_API_KEY } from "./config.server"

export const resend = new Resend(RESEND_API_KEY)
