import type { User } from "@element/database/types"
import { FULL_WEB_URL } from "@element/server-env"

import { ResetPasswordEmail, VerifyAccountEmail } from "../../../../emails/src"
import { mailer } from "../lib/mailer.server"
export async function sendResetPasswordEmail(user: Pick<User, "email">, token: string) {
  try {
    if (!user.email) return
    const link = `${FULL_WEB_URL}/reset-password/${token}`
    await mailer.send({
      react: <ResetPasswordEmail link={link} />,
      to: user.email,
      text: `Reset your password: ${link}`,
      subject: "Reset Password",
    })
  } catch (error) {
    console.log(error)
  }
}

export async function sendAccountVerificationEmail(user: Pick<User, "email">, token: string) {
  try {
    const link = `${FULL_WEB_URL}/api/verify/${token}`
    if (!user.email) return

    await mailer.send({
      react: <VerifyAccountEmail link={link} />,
      to: user.email,
      text: `Verify email: ${link}`,
      subject: "Verify email",
    })
  } catch (error) {
    console.log(error)
  }
}
