import { type ActionArgs, redirect } from "@remix-run/node"

import { getUser } from "~/services/auth/auth.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"
import { sendEmailVerification } from "~/services/user/user.mailer.server"

export const action = async ({ request }: ActionArgs) => {
  const user = await getUser(request)
  if (user.verifiedAt) return redirect("/")
  await sendEmailVerification(user)
  const { createFlash } = await getFlashSession(request)
  return redirect("/timeline/profile", {
    headers: {
      "Set-Cookie": await createFlash(FlashType.Info, "Verification email sent", "You should receive an email shortly"),
    },
  })
}
