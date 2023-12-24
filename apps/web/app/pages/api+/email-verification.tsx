import { type ActionFunctionArgs, redirect } from "@remix-run/node"

import { getCurrentUser } from "~/services/auth/auth.server"
import { FlashType, getFlashSession } from "~/services/session/flash.server"
import { sendEmailVerification } from "~/services/user/user.mailer.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  if (user.verifiedAt) return redirect("/")
  await sendEmailVerification(user)
  const { createFlash } = await getFlashSession(request)
  return redirect("/timeline/profile", {
    headers: {
      "Set-Cookie": await createFlash(FlashType.Info, "Verification email sent", "You should receive an email shortly"),
    },
  })
}
