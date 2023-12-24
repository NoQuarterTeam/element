import { render } from "@react-email/render"
import nodemailer from "nodemailer"
import { type CreateEmailOptions } from "resend/build/src/emails/interfaces"

import { resend } from "./resend.server"
import { IS_PRODUCTION } from "@element/server-env"

// DEV EMAIL
export const DEV_EMAIL_OPTIONS: any = {
  host: "localhost",
  port: 1025,
  secure: false,
  debug: true,
  ignoreTLS: true,
}

type Props = CreateEmailOptions & { react: NonNullable<CreateEmailOptions["react"]> }
class Mailer {
  async send(args: Props) {
    try {
      if (IS_PRODUCTION) {
        await resend.sendEmail(args)
      } else {
        await this.sendDev(args)
      }
    } catch (err) {
      // Sentry.captureException(err)
      console.log("Error sending mail:", err)
    }
  }

  private async sendDev(args: Props) {
    const devMail = nodemailer.createTransport(DEV_EMAIL_OPTIONS)
    const html = render(args.react, { pretty: true })
    const text = render(args.react, { plainText: true })
    return devMail.sendMail({ ...args, html, text })
  }
}

export const mailer = new Mailer()
