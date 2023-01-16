import type { ActionArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"

import { getFlashSession, FlashType } from "~/services/session/flash.server"
import { getUserSession } from "~/services/session/session.server"

export const action = async ({ request }: ActionArgs) => {
  const { destroy } = await getUserSession(request)
  const { createFlash } = await getFlashSession(request)
  const headers = new Headers([
    ["Set-Cookie", await destroy()],
    ["Set-Cookie", await createFlash(FlashType.Info, "Logged out!")],
  ])
  return redirect("/login", { headers })
}

export const loader = () => redirect("/login")
