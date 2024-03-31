import type { SerializeFrom } from "@remix-run/node"
import { useRouteLoaderData } from "@remix-run/react"

import type { loader as appLoader } from "~/pages/_app"
import type { loader as rootLoader } from "~/root"

export function useMaybeUser() {
  return (useRouteLoaderData("root") as SerializeFrom<typeof rootLoader>).user
}

export function useMe() {
  return useRouteLoaderData("pages/_app") as SerializeFrom<typeof appLoader>
}
