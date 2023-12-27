import type { LoaderFunctionArgs } from "@remix-run/node"
import { json } from "@remix-run/node"
import { Outlet, type ShouldRevalidateFunction } from "@remix-run/react"

import { useHydrated } from "~/components/ui/ClientOnly"
import { LoadingScreen } from "~/components/ui/LoadingScreen"
import { getCurrentUser } from "~/services/auth/auth.server"

export const shouldRevalidate: ShouldRevalidateFunction = ({ formAction }) => {
  if (!formAction) return false
  return ["profile"].some((path) => formAction.includes(path))
}
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const user = await getCurrentUser(request)
  return json(user)
}

export default function TimelineLayout() {
  const isHydrated = useHydrated()

  if (!isHydrated) return <LoadingScreen />
  return <Outlet />
}
