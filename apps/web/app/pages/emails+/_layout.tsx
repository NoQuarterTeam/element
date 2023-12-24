import { IS_PRODUCTION } from "@element/server-env"
import { redirect } from "@remix-run/node"
import { Outlet } from "@remix-run/react"

export const loader = () => (IS_PRODUCTION ? redirect("/") : null)

export default function Layout() {
  return <Outlet />
}
