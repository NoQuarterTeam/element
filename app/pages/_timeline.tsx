import * as React from "react"
import type { ShouldReloadFunction } from "@remix-run/react"
import { Outlet, useLoaderData } from "@remix-run/react"
import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"
import { useHydrated } from "remix-utils"

import { requireUser } from "~/services/auth/auth.server"

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
  if (!submission) return false
  return ["/api/profile", "/logout"].some((path) => submission.action.includes(path))
}
export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  return json({ user })
}

type User = UseDataFunctionReturn<typeof loader>["user"]

export default function TimelineLayout() {
  const { user } = useLoaderData<typeof loader>()
  const isHydrated = useHydrated()
  if (!isHydrated) return null
  return (
    <MeContext.Provider value={user}>
      <Outlet />
    </MeContext.Provider>
  )
}

const MeContext = React.createContext<User | null>(null)

export const useMe = () => {
  const me = React.useContext(MeContext)
  if (!me) throw new Error("User must be present")
  return me
}
