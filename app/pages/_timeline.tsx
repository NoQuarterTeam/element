import * as React from "react"
import type { ShouldReloadFunction } from "@remix-run/react"
import { Outlet } from "@remix-run/react"
import type { LoaderArgs } from "@remix-run/server-runtime"
import { typedjson } from "remix-typedjson"
import type { UseDataFunctionReturn} from "remix-typedjson/dist/remix";
import { useTypedLoaderData } from "remix-typedjson/dist/remix"
import { useHydrated } from "remix-utils"

import { requireUser } from "~/services/auth/auth.server"

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
  if (!submission) return false
  return ["/api/profile", "/logout"].some((path) => submission.action.includes(path))
}
export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  return typedjson(user)
}

type User = UseDataFunctionReturn<typeof loader>

export default function TimelineLayout() {
  const user = useTypedLoaderData<typeof loader>()
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
