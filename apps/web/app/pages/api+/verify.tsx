import { sendAccountVerificationEmail } from "@element/server-services"
import { type ActionFunctionArgs } from "@remix-run/node"

import { createToken } from "~/lib/jwt.server"
import { redirect } from "~/lib/remix"
import { getCurrentUser } from "~/services/auth/auth.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const user = await getCurrentUser(request)
  if (user.verifiedAt) return redirect("/")
  const token = await createToken({ id: user.id })
  await sendAccountVerificationEmail(user, token)

  return redirect("/timeline/profile", request, {
    flash: {
      title: "Verification email sent",
      description: "You should receive an email shortly",
    },
  })
}
