import type { LoaderArgs } from "@remix-run/node"
import { redirect } from "@remix-run/node"
import { Outlet } from "@remix-run/react"

import { db } from "~/lib/db.server"
import { getUserSession } from "~/services/session/session.server"

export const loader = async ({ request }: LoaderArgs) => {
  const { userId } = await getUserSession(request)
  if (!userId) return null
  const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (user) return redirect("/")
  return null
}

export default function AuthLayout() {
  return (
    <div className="center flex-col pt-10 md:pt-20">
      <div className="vstack w-full space-y-8 p-4">
        <img src="/logo.png" alt="logo" className="sq-20" />
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
