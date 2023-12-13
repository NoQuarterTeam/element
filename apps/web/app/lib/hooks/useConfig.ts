import { useRouteLoaderData } from "@remix-run/react"

import { type RootLoader } from "~/root"

export function useConfig() {
  return (useRouteLoaderData("root") as RootLoader).config
}
