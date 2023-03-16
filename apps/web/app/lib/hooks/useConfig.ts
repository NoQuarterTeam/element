import { useRouteLoaderData } from "@remix-run/react"
import { RootLoader } from "~/root"

export function useConfig() {
  return (useRouteLoaderData("root") as RootLoader).config
}
