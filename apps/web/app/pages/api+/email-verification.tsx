import { type ActionFunctionArgs } from "@remix-run/node"
import { redirect } from "~/lib/remix"

import { getCurrentUser } from "~/services/auth/auth.server"

import { sendEmailVerification } from "~/services/user/user.mailer.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  if (user.verifiedAt) return redirect("/")
  await sendEmailVerification(user)

  return redirect("/timeline/profile", request, {
    flash: {
      title: "Verification email sent",
      description: "You should receive an email shortly",
    },
  })
}
