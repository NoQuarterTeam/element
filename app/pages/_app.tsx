import type { LoaderArgs, SerializeFrom } from "@remix-run/node"
import { json } from "@remix-run/node"
import { type ShouldRevalidateFunction, useRouteLoaderData } from "@remix-run/react"
import { useLoaderData } from "@remix-run/react"
import { Outlet } from "@remix-run/react"
import { useHydrated } from "remix-utils"

import { requireUser } from "~/services/auth/auth.server"

export const shouldRevalidate: ShouldRevalidateFunction = ({ formAction }) => {
  if (!formAction) return false
  return ["profile"].some((path) => formAction.includes(path))
}
export const loader = async ({ request }: LoaderArgs) => {
  const user = await requireUser(request)
  return json(user)
}

type User = SerializeFrom<typeof loader>

export default function TimelineLayout() {
  useLoaderData<typeof loader>()
  const isHydrated = useHydrated()

  if (!isHydrated)
    return (
      <div className="center inset-0 z-[100] flex h-screen w-screen bg-gray-900">
        <img src="/logo.png" className="w-[100px]" alt="loading" />
      </div>
    )
  return <Outlet />
}

export function useMe() {
  return useRouteLoaderData("pages/_app") as User
}
