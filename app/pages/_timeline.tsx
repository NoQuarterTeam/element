import * as React from "react"
import type { ShouldReloadFunction } from "@remix-run/react"
import { Outlet, useLoaderData } from "@remix-run/react"
import type { UseDataFunctionReturn } from "@remix-run/react/dist/components"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { json } from "@remix-run/server-runtime"

import { requireUser } from "~/services/auth/auth.server"

let hydrating = true

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
  // client side render the timeline, so the react-beautiful-dnd library doesnt freak out
  const [hydrated, setHydrated] = React.useState(() => !hydrating)
  React.useEffect(() => {
    hydrating = false
    setHydrated(true)
  }, [])
  if (!hydrated) return null
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
