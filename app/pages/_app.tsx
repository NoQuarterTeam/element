import * as React from "react"
import * as c from "@chakra-ui/react"
import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import type { ShouldReloadFunction } from "@remix-run/react"
import { useLoaderData } from "@remix-run/react"
import { Outlet } from "@remix-run/react"
import { useHydrated } from "remix-utils"

import { requireUser } from "~/services/auth/auth.server"

export const unstable_shouldReload: ShouldReloadFunction = ({ submission }) => {
  if (!submission) return false
  return ["profile"].some((path) => submission.action.includes(path))
}
export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  return json(user)
}

type User = SerializeFrom<typeof loader>

export default function TimelineLayout() {
  const user = useLoaderData<typeof loader>()
  const isHydrated = useHydrated()
  const loadingBg = c.useColorModeValue("gray.900", "gray.900")
  if (!isHydrated)
    return (
      <c.Center pos="fixed" top={0} left={0} zIndex={100} h="100vh" w="100vw" bg={loadingBg}>
        <c.Image src="/logo.png" boxSize="100px" />
      </c.Center>
    )
  return (
    <MeContext.Provider value={user}>
      <Outlet />
    </MeContext.Provider>
  )
}

const MeContext = React.createContext<User | null>(null)

export function useMe() {
  const me = React.useContext(MeContext)
  if (!me) throw new Error("User must be present")
  return me
}
