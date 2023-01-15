import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import { type ShouldRevalidateFunction, useRouteLoaderData } from "@remix-run/react"
import { useLoaderData } from "@remix-run/react"
import { Outlet } from "@remix-run/react"
import { useHydrated } from "remix-utils"

import { LoadingScreen } from "~/components/ui/LoadingScreen"
import { getUser } from "~/services/auth/auth.server"

export const shouldRevalidate: ShouldRevalidateFunction = ({ formAction }) => {
  if (!formAction) return false
  return ["profile"].some((path) => formAction.includes(path))
}
export const loader = async ({ request }: LoaderArgs) => {
  const user = await getUser(request)
  return json(user)
}

export type CurrentUser = SerializeFrom<typeof loader>

export default function TimelineLayout() {
  useLoaderData<typeof loader>()
  const isHydrated = useHydrated()

  if (!isHydrated) return <LoadingScreen />
  return (
    <div className="bg-white dark:bg-gray-800">
      <Outlet />
    </div>
  )
}

export function useMe() {
  return useRouteLoaderData("pages/_app") as CurrentUser
}
