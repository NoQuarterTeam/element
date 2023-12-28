import type { User } from "@element/database/types"
import { FULL_WEB_URL } from "@element/server-env"

import { mailer } from "~/lib/mailer.server"
import ResetPasswordTemplate from "~/pages/emails+/reset-password"

import { type CurrentUser } from "../auth/auth.server"

export async function sendResetPasswordEmail(user: User, token: string) {
  try {
    if (!user.email) return

    await mailer.send({
      react: <ResetPasswordTemplate link={`${FULL_WEB_URL}/reset-password/${token}`} />,
      to: user.email,
      from: "info@noquarter.co",
      subject: "Reset Password",
    })
  } catch (error) {
    console.log(error)
  }
}

export async function sendEmailVerification(user: CurrentUser) {
  try {
    if (!user.email) return
    // const token = createToken({ id: user.id }, { expiresIn: "30 mins" })
    // await mailer.send({
    //   react: <VerifyAccountEmail link={`${FULL_WEB_URL}/api/email-verification/${token}`} />,
    //   to: user.email,
    //   from: "info@noquarter.co",
    //   subject: "Verify account",
    // })
  } catch (error) {
    console.log(error)
  }
}
