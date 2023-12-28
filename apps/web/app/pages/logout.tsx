import type { ActionFunctionArgs } from "@remix-run/node"

import { redirect } from "~/lib/remix"
import { getUserSession } from "~/services/session/session.server"

export const action = async ({ request }: ActionFunctionArgs) => {
  const { destroy } = await getUserSession(request)
  const headers = new Headers([["Set-Cookie", await destroy()]])
  return redirect("/login", request, { flash: { title: "Logged out!", description: "See you soon!" }, headers })
}

export const loader = () => redirect("/login")
